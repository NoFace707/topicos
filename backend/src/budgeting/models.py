from decimal import Decimal
from datetime import time

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class Account(models.Model):
    class Type(models.TextChoices):
        CASH = "cash", "Efectivo"
        BANK = "bank", "Banco"
        CREDIT_CARD = "credit_card", "Tarjeta"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="accounts"
    )
    name = models.CharField(max_length=120)
    account_type = models.CharField(max_length=20, choices=Type.choices)
    opening_balance = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0.00")
    )
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["is_archived", "name", "id"]
        indexes = [models.Index(fields=["user", "is_archived"])]

    def __str__(self):
        return self.name


class CategoryGroup(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="category_groups",
    )
    name = models.CharField(max_length=120)
    position = models.PositiveIntegerField(default=0)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "id"]
        indexes = [models.Index(fields=["user", "is_archived", "position"])]

    def __str__(self):
        return self.name


class Category(models.Model):
    group = models.ForeignKey(
        CategoryGroup, on_delete=models.PROTECT, related_name="categories"
    )
    name = models.CharField(max_length=120)
    position = models.PositiveIntegerField(default=0)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["group__position", "position", "id"]
        indexes = [models.Index(fields=["group", "is_archived", "position"])]

    @property
    def user_id(self):
        return self.group.user_id

    def __str__(self):
        return self.name


class BudgetAllocation(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="allocations"
    )
    month = models.DateField(help_text="Primer día del mes presupuestado")
    assigned = models.DecimalField(
        max_digits=14, decimal_places=2, default=Decimal("0.00")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["month", "category_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["category", "month"], name="unique_category_month_allocation"
            )
        ]
        indexes = [models.Index(fields=["category", "month"])]

    def clean(self):
        if self.month:
            self.month = self.month.replace(day=1)
        if self.category_id and self.category.is_archived:
            raise ValidationError({"category": "No se puede asignar a una categoría archivada."})

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class FinancialTransaction(models.Model):
    class Type(models.TextChoices):
        INCOME = "income", "Ingreso"
        EXPENSE = "expense", "Gasto"
        TRANSFER = "transfer", "Transferencia"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="financial_transactions",
    )
    transaction_type = models.CharField(max_length=20, choices=Type.choices)
    date = models.DateField()
    transaction_time = models.TimeField(default=time(0, 0))
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    counterparty = models.CharField(max_length=120, blank=True)
    memo = models.CharField(max_length=255, blank=True)
    account = models.ForeignKey(
        Account, on_delete=models.PROTECT, related_name="transactions"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="transactions",
        null=True,
        blank=True,
    )
    destination_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="incoming_transfers",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-transaction_time", "-id"]
        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gt=0), name="transaction_amount_positive"
            )
        ]
        indexes = [
            models.Index(fields=["user", "date"]),
            models.Index(fields=["account", "date"]),
            models.Index(fields=["category", "date"]),
            models.Index(fields=["destination_account", "date"]),
        ]

    def clean(self):
        errors = {}
        if self.amount is not None and self.amount <= 0:
            errors["amount"] = "El importe debe ser mayor que cero."
        if self.account_id:
            if self.account.user_id != self.user_id:
                errors["account"] = "La cuenta no pertenece al usuario."
            if self.account.is_archived:
                errors["account"] = "La cuenta está archivada."

        if self.transaction_type == self.Type.EXPENSE:
            if not self.category_id:
                errors["category"] = "Los gastos requieren una categoría."
            elif self.category.user_id != self.user_id:
                errors["category"] = "La categoría no pertenece al usuario."
            elif self.category.is_archived:
                errors["category"] = "La categoría está archivada."
            if self.destination_account_id:
                errors["destination_account"] = "Un gasto no usa cuenta destino."
        elif self.transaction_type == self.Type.INCOME:
            if self.category_id and self.category.user_id != self.user_id:
                errors["category"] = "La categoría no pertenece al usuario."
            elif self.category_id and self.category.is_archived:
                errors["category"] = "La categoría está archivada."
            if self.destination_account_id:
                errors["destination_account"] = "Un ingreso no usa cuenta destino."
        elif self.transaction_type == self.Type.TRANSFER:
            if self.category_id:
                errors["category"] = "Una transferencia no usa categoría."
            if not self.destination_account_id:
                errors["destination_account"] = "La transferencia requiere una cuenta destino."
            elif self.destination_account.user_id != self.user_id:
                errors["destination_account"] = "La cuenta destino no pertenece al usuario."
            elif self.destination_account.is_archived:
                errors["destination_account"] = "La cuenta destino está archivada."
            elif self.destination_account_id == self.account_id:
                errors["destination_account"] = "Las cuentas de origen y destino deben ser distintas."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
