from datetime import date

from django.conf import settings
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Account, BudgetAllocation, Category, CategoryGroup, FinancialTransaction
from .serializers import (
    AccountSerializer,
    BudgetAllocationSerializer,
    CategoryGroupSerializer,
    CategorySerializer,
    EnvelopeTransferSerializer,
    FinancialTransactionSerializer,
)
from .services import bulk_account_balances, dashboard_payload, month_start


class NoDeleteViewSet(viewsets.ModelViewSet):
    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed("DELETE", detail="Este recurso se archiva en lugar de eliminarse.")


class AccountViewSet(NoDeleteViewSet):
    serializer_class = AccountSerializer

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        queryset = getattr(self, "_balance_accounts", None)
        if queryset is not None:
            context["balances"] = bulk_account_balances(queryset)
        return context

    def list(self, request, *args, **kwargs):
        self._balance_accounts = list(self.filter_queryset(self.get_queryset()))
        serializer = self.get_serializer(self._balance_accounts, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        account = self.get_object()
        account.is_archived = True
        account.save(update_fields=["is_archived", "updated_at"])
        return Response(self.get_serializer(account).data)

    @action(detail=True, methods=["post"])
    def reactivate(self, request, pk=None):
        account = self.get_object()
        account.is_archived = False
        account.save(update_fields=["is_archived", "updated_at"])
        return Response(self.get_serializer(account).data)


class CategoryGroupViewSet(NoDeleteViewSet):
    serializer_class = CategoryGroupSerializer

    def get_queryset(self):
        return CategoryGroup.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        group = self.get_object()
        if group.categories.filter(is_archived=False).exists():
            raise ValidationError(
                {"detail": "Mueve o archiva las categorías activas antes de archivar el grupo."}
            )
        group.is_archived = True
        group.save(update_fields=["is_archived", "updated_at"])
        return Response(self.get_serializer(group).data)

    @action(detail=True, methods=["post"])
    def reactivate(self, request, pk=None):
        group = self.get_object()
        group.is_archived = False
        group.save(update_fields=["is_archived", "updated_at"])
        return Response(self.get_serializer(group).data)


class CategoryViewSet(NoDeleteViewSet):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(group__user=self.request.user).select_related("group")

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        category = self.get_object()
        category.is_archived = True
        category.save(update_fields=["is_archived", "updated_at"])
        return Response(self.get_serializer(category).data)

    @action(detail=True, methods=["post"])
    def reactivate(self, request, pk=None):
        category = self.get_object()
        if category.group.is_archived:
            raise ValidationError({"detail": "Reactiva primero el grupo de la categoría."})
        category.is_archived = False
        category.save(update_fields=["is_archived", "updated_at"])
        return Response(self.get_serializer(category).data)


class BudgetAllocationViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetAllocationSerializer

    def get_queryset(self):
        queryset = BudgetAllocation.objects.filter(
            category__group__user=self.request.user
        ).select_related("category")
        month = self.request.query_params.get("month")
        if month:
            try:
                queryset = queryset.filter(month=month_start(month))
            except ValueError as exc:
                raise ValidationError({"month": str(exc)})
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        allocation, created = BudgetAllocation.objects.update_or_create(
            category=data["category"],
            month=data["month"],
            defaults={"assigned": data.get("assigned", 0)},
        )
        output = self.get_serializer(allocation)
        return Response(
            output.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class FinancialTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialTransactionSerializer

    def get_queryset(self):
        queryset = FinancialTransaction.objects.filter(user=self.request.user).select_related(
            "account", "category", "destination_account"
        )
        account_id = self.request.query_params.get("account")
        transaction_type = self.request.query_params.get("type")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if account_id:
            queryset = queryset.filter(account_id=account_id) | queryset.filter(
                destination_account_id=account_id
            )
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        return queryset.distinct()

    @transaction.atomic
    def perform_destroy(self, instance):
        instance.delete()


class EnvelopeTransferView(APIView):
    def post(self, request):
        serializer = EnvelopeTransferSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        allocation_context = {"request": request}
        return Response(
            {
                "month": result["month"].isoformat(),
                "source_allocation": BudgetAllocationSerializer(
                    result["source_allocation"], context=allocation_context
                ).data,
                "destination_allocation": BudgetAllocationSerializer(
                    result["destination_allocation"], context=allocation_context
                ).data,
            }
        )


class DashboardView(APIView):
    def get(self, request):
        raw_month = request.query_params.get("month")
        try:
            selected_month = month_start(raw_month) if raw_month else date.today().replace(day=1)
        except ValueError as exc:
            raise ValidationError({"month": str(exc)})
        return Response(
            dashboard_payload(request.user, selected_month, settings.APP_CURRENCY)
        )

