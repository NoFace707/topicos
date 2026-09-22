from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction as db_transaction
from django.db.models import Max
from rest_framework import serializers

from .models import Account, BudgetAllocation, Category, CategoryGroup, FinancialTransaction
from .services import account_balance


class AccountSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Account
        fields = [
            "id",
            "name",
            "account_type",
            "opening_balance",
            "balance",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "balance", "created_at", "updated_at"]

    def get_balance(self, obj):
        balances = self.context.get("balances", {})
        if obj.id in balances:
            return balances[obj.id]
        return account_balance(obj)


class CategoryGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryGroup
        fields = ["id", "name", "position", "is_archived", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        if "position" not in validated_data:
            current_max = (
                CategoryGroup.objects.filter(user=validated_data["user"])
                .aggregate(value=Max("position"))["value"]
            )
            validated_data["position"] = (current_max if current_max is not None else -1) + 1
        return super().create(validated_data)


class CategorySerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source="group.name", read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "group",
            "group_name",
            "name",
            "position",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "group_name", "created_at", "updated_at"]

    def validate_group(self, group):
        user = self.context["request"].user
        if group.user_id != user.id:
            raise serializers.ValidationError("El grupo no está disponible.")
        if group.is_archived:
            raise serializers.ValidationError("El grupo está archivado.")
        return group

    @staticmethod
    def next_position(group):
        current_max = group.categories.aggregate(value=Max("position"))["value"]
        return (current_max if current_max is not None else -1) + 1

    def create(self, validated_data):
        if "position" not in validated_data:
            validated_data["position"] = self.next_position(validated_data["group"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        target_group = validated_data.get("group", instance.group)
        if target_group.id != instance.group_id and "position" not in validated_data:
            validated_data["position"] = self.next_position(target_group)
        return super().update(instance, validated_data)


class BudgetAllocationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = BudgetAllocation
        fields = ["id", "category", "category_name", "month", "assigned", "updated_at"]
        read_only_fields = ["id", "category_name", "updated_at"]
        # El endpoint usa update_or_create para que categoria+mes sea idempotente.
        validators = []

    def validate(self, attrs):
        category = attrs.get("category", getattr(self.instance, "category", None))
        month = attrs.get("month", getattr(self.instance, "month", None))
        user = self.context["request"].user
        if category and category.user_id != user.id:
            raise serializers.ValidationError({"category": "La categoría no está disponible."})
        if category and category.is_archived:
            raise serializers.ValidationError({"category": "La categoría está archivada."})
        if month:
            attrs["month"] = month.replace(day=1)
        return attrs


class FinancialTransactionSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source="account.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    destination_account_name = serializers.CharField(
        source="destination_account.name", read_only=True
    )

    class Meta:
        model = FinancialTransaction
        fields = [
            "id",
            "transaction_type",
            "date",
            "amount",
            "memo",
            "account",
            "account_name",
            "category",
            "category_name",
            "destination_account",
            "destination_account_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "account_name",
            "category_name",
            "destination_account_name",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        user = self.context["request"].user
        values = {
            "transaction_type": attrs.get(
                "transaction_type", getattr(self.instance, "transaction_type", None)
            ),
            "date": attrs.get("date", getattr(self.instance, "date", None)),
            "amount": attrs.get("amount", getattr(self.instance, "amount", None)),
            "memo": attrs.get("memo", getattr(self.instance, "memo", "")),
            "account": attrs.get("account", getattr(self.instance, "account", None)),
            "category": attrs.get("category", getattr(self.instance, "category", None)),
            "destination_account": attrs.get(
                "destination_account", getattr(self.instance, "destination_account", None)
            ),
        }
        candidate = FinancialTransaction(user=user, **values)
        if self.instance:
            candidate.pk = self.instance.pk
        try:
            candidate.clean()
        except DjangoValidationError as exc:
            detail = exc.message_dict if hasattr(exc, "message_dict") else {"detail": exc.messages}
            raise serializers.ValidationError(detail)
        return attrs

    @db_transaction.atomic
    def create(self, validated_data):
        return FinancialTransaction.objects.create(
            user=self.context["request"].user, **validated_data
        )

    @db_transaction.atomic
    def update(self, instance, validated_data):
        return super().update(instance, validated_data)
