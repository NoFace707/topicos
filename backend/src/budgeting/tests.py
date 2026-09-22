from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Account, BudgetAllocation, Category, CategoryGroup, FinancialTransaction
from .services import account_balance, category_budget_rows, dashboard_payload, ready_to_assign


User = get_user_model()


class BudgetingTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="owner", password="123456")
        self.other = User.objects.create_user(username="other", password="123456")
        self.client.force_authenticate(self.user)
        self.bank = Account.objects.create(
            user=self.user,
            name="Banco",
            account_type=Account.Type.BANK,
            opening_balance=Decimal("1000.00"),
        )
        self.cash = Account.objects.create(
            user=self.user,
            name="Efectivo",
            account_type=Account.Type.CASH,
            opening_balance=Decimal("100.00"),
        )
        self.card = Account.objects.create(
            user=self.user,
            name="Tarjeta",
            account_type=Account.Type.CREDIT_CARD,
            opening_balance=Decimal("-250.00"),
        )
        self.group = CategoryGroup.objects.create(user=self.user, name="Necesidades", position=1)
        self.category = Category.objects.create(group=self.group, name="Comida", position=1)

    def transaction(self, transaction_type, amount, when, **kwargs):
        return FinancialTransaction.objects.create(
            user=self.user,
            transaction_type=transaction_type,
            amount=Decimal(amount),
            date=when,
            account=kwargs.pop("account", self.bank),
            **kwargs,
        )

    def test_account_balance_includes_every_transaction_type(self):
        self.transaction(FinancialTransaction.Type.INCOME, "200.00", date(2026, 1, 2))
        self.transaction(
            FinancialTransaction.Type.EXPENSE,
            "50.00",
            date(2026, 1, 3),
            category=self.category,
        )
        self.transaction(
            FinancialTransaction.Type.TRANSFER,
            "125.00",
            date(2026, 1, 4),
            destination_account=self.cash,
        )
        self.assertEqual(account_balance(self.bank), Decimal("1025.00"))
        self.assertEqual(account_balance(self.cash), Decimal("225.00"))

    def test_category_available_carries_positive_and_negative_three_months(self):
        BudgetAllocation.objects.create(
            category=self.category, month=date(2026, 1, 1), assigned=Decimal("100.00")
        )
        self.transaction(
            FinancialTransaction.Type.EXPENSE,
            "40.00",
            date(2026, 1, 15),
            category=self.category,
        )
        BudgetAllocation.objects.create(
            category=self.category, month=date(2026, 2, 1), assigned=Decimal("20.00")
        )
        self.transaction(
            FinancialTransaction.Type.EXPENSE,
            "100.00",
            date(2026, 2, 15),
            category=self.category,
        )
        BudgetAllocation.objects.create(
            category=self.category, month=date(2026, 3, 1), assigned=Decimal("15.00")
        )

        january = category_budget_rows(self.user, date(2026, 1, 1))[0]
        february = category_budget_rows(self.user, date(2026, 2, 1))[0]
        march = category_budget_rows(self.user, date(2026, 3, 1))[0]
        self.assertEqual(january["available"], Decimal("60.00"))
        self.assertEqual(february["available"], Decimal("-20.00"))
        self.assertEqual(march["available"], Decimal("-5.00"))

    def test_ready_to_assign_excludes_card_and_transfer_and_allows_negative(self):
        self.transaction(FinancialTransaction.Type.INCOME, "100.00", date(2026, 1, 2))
        self.transaction(
            FinancialTransaction.Type.INCOME,
            "500.00",
            date(2026, 1, 2),
            account=self.card,
        )
        self.transaction(
            FinancialTransaction.Type.TRANSFER,
            "100.00",
            date(2026, 1, 3),
            destination_account=self.cash,
        )
        BudgetAllocation.objects.create(
            category=self.category, month=date(2026, 1, 1), assigned=Decimal("1300.00")
        )
        self.assertEqual(ready_to_assign(self.user, date(2026, 1, 1)), Decimal("-100.00"))

    def test_domain_rejects_foreign_archived_and_invalid_transfer_resources(self):
        foreign = Account.objects.create(
            user=self.other,
            name="Ajena",
            account_type=Account.Type.BANK,
        )
        invalid = FinancialTransaction(
            user=self.user,
            transaction_type=FinancialTransaction.Type.TRANSFER,
            date=date(2026, 1, 1),
            amount=Decimal("10.00"),
            account=self.bank,
            destination_account=foreign,
        )
        with self.assertRaises(ValidationError):
            invalid.full_clean()

        same_account = FinancialTransaction(
            user=self.user,
            transaction_type=FinancialTransaction.Type.TRANSFER,
            date=date(2026, 1, 1),
            amount=Decimal("10.00"),
            account=self.bank,
            destination_account=self.bank,
        )
        with self.assertRaises(ValidationError):
            same_account.full_clean()

        uncategorized = FinancialTransaction(
            user=self.user,
            transaction_type=FinancialTransaction.Type.EXPENSE,
            date=date(2026, 1, 1),
            amount=Decimal("10.00"),
            account=self.bank,
        )
        with self.assertRaises(ValidationError):
            uncategorized.full_clean()

        self.category.is_archived = True
        self.category.save()
        expense = FinancialTransaction(
            user=self.user,
            transaction_type=FinancialTransaction.Type.EXPENSE,
            date=date(2026, 1, 1),
            amount=Decimal("10.00"),
            account=self.bank,
            category=self.category,
        )
        with self.assertRaises(ValidationError):
            expense.full_clean()

        self.cash.is_archived = True
        self.cash.save()
        archived_account = FinancialTransaction(
            user=self.user,
            transaction_type=FinancialTransaction.Type.INCOME,
            date=date(2026, 1, 1),
            amount=Decimal("10.00"),
            account=self.cash,
        )
        with self.assertRaises(ValidationError):
            archived_account.full_clean()

    def test_account_api_crud_accepts_all_types_and_calculated_balance(self):
        for account_type in Account.Type.values:
            response = self.client.post(
                reverse("account-list"),
                {
                    "name": f"Nueva {account_type}",
                    "account_type": account_type,
                    "opening_balance": "42.50",
                },
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(Decimal(response.data["balance"]), Decimal("42.50"))
        updated = self.client.patch(
            reverse("account-detail", args=[self.bank.id]),
            {"name": "Banco principal"},
            format="json",
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.assertEqual(updated.data["name"], "Banco principal")

    def test_every_financial_resource_is_isolated_by_owner(self):
        foreign_account = Account.objects.create(
            user=self.other, name="Ajena", account_type=Account.Type.BANK
        )
        foreign_group = CategoryGroup.objects.create(user=self.other, name="Ajeno")
        foreign_category = Category.objects.create(group=foreign_group, name="Ajena")
        foreign_allocation = BudgetAllocation.objects.create(
            category=foreign_category, month=date(2026, 1, 1), assigned=Decimal("20.00")
        )
        foreign_transaction = FinancialTransaction.objects.create(
            user=self.other,
            transaction_type=FinancialTransaction.Type.INCOME,
            date=date(2026, 1, 1),
            amount=Decimal("20.00"),
            account=foreign_account,
        )
        resources = [
            ("account-detail", foreign_account.id),
            ("category-group-detail", foreign_group.id),
            ("category-detail", foreign_category.id),
            ("allocation-detail", foreign_allocation.id),
            ("transaction-detail", foreign_transaction.id),
        ]
        for route, resource_id in resources:
            with self.subTest(route=route):
                response = self.client.get(reverse(route, args=[resource_id]))
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        dashboard = self.client.get(reverse("dashboard"), {"month": "2026-01"})
        self.assertNotContains(dashboard, "Ajena")

    def test_account_api_isolated_and_archive_preserves_history(self):
        foreign = Account.objects.create(
            user=self.other, name="Ajena", account_type=Account.Type.CASH
        )
        self.assertEqual(
            self.client.get(reverse("account-detail", args=[foreign.id])).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        archived = self.client.post(reverse("account-archive", args=[self.bank.id]))
        self.assertEqual(archived.status_code, status.HTTP_200_OK)
        self.bank.refresh_from_db()
        self.assertTrue(self.bank.is_archived)
        reactivated = self.client.post(reverse("account-reactivate", args=[self.bank.id]))
        self.assertEqual(reactivated.status_code, status.HTTP_200_OK)

    def test_group_archive_requires_categories_to_be_archived(self):
        blocked = self.client.post(reverse("category-group-archive", args=[self.group.id]))
        self.assertEqual(blocked.status_code, status.HTTP_400_BAD_REQUEST)
        self.client.post(reverse("category-archive", args=[self.category.id]))
        archived = self.client.post(reverse("category-group-archive", args=[self.group.id]))
        self.assertEqual(archived.status_code, status.HTTP_200_OK)

    def test_allocation_endpoint_is_idempotent_and_normalizes_month(self):
        url = reverse("allocation-list")
        first = self.client.post(
            url,
            {"category": self.category.id, "month": "2026-01-18", "assigned": "10.00"},
            format="json",
        )
        second = self.client.post(
            url,
            {"category": self.category.id, "month": "2026-01-01", "assigned": "25.00"},
            format="json",
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(BudgetAllocation.objects.count(), 1)
        self.assertEqual(BudgetAllocation.objects.get().assigned, Decimal("25.00"))

        zero = self.client.post(
            url,
            {"category": self.category.id, "month": "2026-02-01", "assigned": "0.00"},
            format="json",
        )
        negative = self.client.post(
            url,
            {"category": self.category.id, "month": "2026-03-01", "assigned": "-15.00"},
            format="json",
        )
        self.assertEqual(zero.status_code, status.HTTP_201_CREATED)
        self.assertEqual(negative.status_code, status.HTTP_201_CREATED)
        self.category.is_archived = True
        self.category.save()
        archived = self.client.post(
            url,
            {"category": self.category.id, "month": "2026-04-01", "assigned": "10.00"},
            format="json",
        )
        self.assertEqual(archived.status_code, status.HTTP_400_BAD_REQUEST)

    def test_category_api_persists_order_and_moves_between_groups(self):
        second_group = CategoryGroup.objects.create(
            user=self.user, name="Deseos", position=3
        )
        created = self.client.post(
            reverse("category-list"),
            {"group": self.group.id, "name": "Transporte", "position": 7},
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        moved = self.client.patch(
            reverse("category-detail", args=[created.data["id"]]),
            {"group": second_group.id, "position": 2},
            format="json",
        )
        self.assertEqual(moved.status_code, status.HTTP_200_OK)
        self.assertEqual(moved.data["group"], second_group.id)
        self.assertEqual(moved.data["position"], 2)

    def test_groups_and_categories_receive_automatic_positions(self):
        created_group = self.client.post(
            reverse("category-group-list"),
            {"name": "Ahorro"},
            format="json",
        )
        self.assertEqual(created_group.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created_group.data["position"], 2)

        created_category = self.client.post(
            reverse("category-list"),
            {"group": self.group.id, "name": "Transporte"},
            format="json",
        )
        self.assertEqual(created_category.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created_category.data["position"], 2)

        edited = self.client.patch(
            reverse("category-detail", args=[created_category.data["id"]]),
            {"name": "Movilidad"},
            format="json",
        )
        self.assertEqual(edited.data["position"], 2)

        moved = self.client.patch(
            reverse("category-detail", args=[created_category.data["id"]]),
            {"group": created_group.data["id"]},
            format="json",
        )
        self.assertEqual(moved.data["position"], 0)

    def test_transfer_api_is_atomic_and_does_not_change_budget(self):
        before_ready = ready_to_assign(self.user, date(2026, 1, 1))
        valid = self.client.post(
            reverse("transaction-list"),
            {
                "transaction_type": "transfer",
                "date": "2026-01-10",
                "amount": "75.00",
                "account": self.bank.id,
                "destination_account": self.cash.id,
            },
            format="json",
        )
        self.assertEqual(valid.status_code, status.HTTP_201_CREATED)
        self.assertEqual(account_balance(self.bank), Decimal("925.00"))
        self.assertEqual(account_balance(self.cash), Decimal("175.00"))
        self.assertEqual(ready_to_assign(self.user, date(2026, 1, 1)), before_ready)
        invalid = self.client.post(
            reverse("transaction-list"),
            {
                "transaction_type": "transfer",
                "date": "2026-01-10",
                "amount": "10.00",
                "account": self.bank.id,
                "destination_account": self.bank.id,
            },
            format="json",
        )
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(FinancialTransaction.objects.filter(transaction_type="transfer").count(), 1)

    def test_transaction_api_filters_and_recalculates_after_edit_and_delete(self):
        create = self.client.post(
            reverse("transaction-list"),
            {
                "transaction_type": "expense",
                "date": "2026-01-20",
                "amount": "50.00",
                "account": self.bank.id,
                "category": self.category.id,
                "memo": "Mercado",
            },
            format="json",
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED)
        transaction_id = create.data["id"]
        filtered = self.client.get(reverse("transaction-list"), {"type": "expense"})
        self.assertEqual(len(filtered.data["results"]), 1)
        self.client.patch(
            reverse("transaction-detail", args=[transaction_id]),
            {"date": "2026-02-01", "amount": "75.00"},
            format="json",
        )
        january = category_budget_rows(self.user, date(2026, 1, 1))[0]
        february = category_budget_rows(self.user, date(2026, 2, 1))[0]
        self.assertEqual(january["activity"], Decimal("0.00"))
        self.assertEqual(february["activity"], Decimal("-75.00"))
        self.client.delete(reverse("transaction-detail", args=[transaction_id]))
        self.assertEqual(
            category_budget_rows(self.user, date(2026, 2, 1))[0]["activity"],
            Decimal("0.00"),
        )

    def test_dashboard_groups_categories_and_scales_to_more_categories(self):
        for index in range(8):
            Category.objects.create(group=self.group, name=f"Extra {index}", position=index + 2)
        payload = dashboard_payload(self.user, date(2026, 1, 1), "BOB")
        self.assertEqual(payload["total_balance"], Decimal("850.00"))
        self.assertEqual(payload["ready_to_assign"], Decimal("1100.00"))
        self.assertEqual(len(payload["groups"]), 1)
        self.assertEqual(len(payload["groups"][0]["categories"]), 9)

        response = self.client.get(reverse("dashboard"), {"month": "2026-02"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["month"], "2026-02-01")
