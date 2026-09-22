import decimal

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="Account",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("account_type", models.CharField(choices=[("cash", "Efectivo"), ("bank", "Banco"), ("credit_card", "Tarjeta")], max_length=20)),
                ("opening_balance", models.DecimalField(decimal_places=2, default=decimal.Decimal("0.00"), max_digits=14)),
                ("is_archived", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="accounts", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["is_archived", "name", "id"]},
        ),
        migrations.CreateModel(
            name="CategoryGroup",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("position", models.PositiveIntegerField(default=0)),
                ("is_archived", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="category_groups", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["position", "id"]},
        ),
        migrations.CreateModel(
            name="Category",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("position", models.PositiveIntegerField(default=0)),
                ("is_archived", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("group", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="categories", to="budgeting.categorygroup")),
            ],
            options={"ordering": ["group__position", "position", "id"]},
        ),
        migrations.CreateModel(
            name="BudgetAllocation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("month", models.DateField(help_text="Primer día del mes presupuestado")),
                ("assigned", models.DecimalField(decimal_places=2, default=decimal.Decimal("0.00"), max_digits=14)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="allocations", to="budgeting.category")),
            ],
            options={"ordering": ["month", "category_id"]},
        ),
        migrations.CreateModel(
            name="FinancialTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("transaction_type", models.CharField(choices=[("income", "Ingreso"), ("expense", "Gasto"), ("transfer", "Transferencia")], max_length=20)),
                ("date", models.DateField()),
                ("amount", models.DecimalField(decimal_places=2, max_digits=14)),
                ("memo", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("account", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="transactions", to="budgeting.account")),
                ("category", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="transactions", to="budgeting.category")),
                ("destination_account", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="incoming_transfers", to="budgeting.account")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="financial_transactions", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-date", "-id"]},
        ),
        migrations.AddIndex(model_name="account", index=models.Index(fields=["user", "is_archived"], name="budgeting_a_user_id_2c7cae_idx")),
        migrations.AddIndex(model_name="categorygroup", index=models.Index(fields=["user", "is_archived", "position"], name="budgeting_c_user_id_a9c67f_idx")),
        migrations.AddIndex(model_name="category", index=models.Index(fields=["group", "is_archived", "position"], name="budgeting_c_group_i_ddac0d_idx")),
        migrations.AddIndex(model_name="budgetallocation", index=models.Index(fields=["category", "month"], name="budgeting_b_categor_1c1e61_idx")),
        migrations.AddConstraint(model_name="budgetallocation", constraint=models.UniqueConstraint(fields=("category", "month"), name="unique_category_month_allocation")),
        migrations.AddIndex(model_name="financialtransaction", index=models.Index(fields=["user", "date"], name="budgeting_f_user_id_ceaeed_idx")),
        migrations.AddIndex(model_name="financialtransaction", index=models.Index(fields=["account", "date"], name="budgeting_f_account_624eea_idx")),
        migrations.AddIndex(model_name="financialtransaction", index=models.Index(fields=["category", "date"], name="budgeting_f_categor_5859bb_idx")),
        migrations.AddIndex(model_name="financialtransaction", index=models.Index(fields=["destination_account", "date"], name="budgeting_f_destina_d23696_idx")),
        migrations.AddConstraint(model_name="financialtransaction", constraint=models.CheckConstraint(condition=models.Q(("amount__gt", 0)), name="transaction_amount_positive")),
    ]
