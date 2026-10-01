from collections import defaultdict
from datetime import date
from decimal import Decimal

from django.db.models import Sum

from .models import Account, BudgetAllocation, Category, FinancialTransaction


ZERO = Decimal("0.00")


def month_start(value):
    if isinstance(value, str):
        try:
            year, month = (int(part) for part in value.split("-", 1))
            return date(year, month, 1)
        except (TypeError, ValueError):
            raise ValueError("El mes debe usar el formato YYYY-MM.")
    return value.replace(day=1)


def next_month(value):
    value = month_start(value)
    if value.month == 12:
        return date(value.year + 1, 1, 1)
    return date(value.year, value.month + 1, 1)


def bulk_account_balances(accounts):
    accounts = list(accounts)
    if not accounts:
        return {}
    account_ids = [account.id for account in accounts]
    balances = {account.id: account.opening_balance for account in accounts}
    user_id = accounts[0].user_id

    outgoing = (
        FinancialTransaction.objects.filter(user_id=user_id, account_id__in=account_ids)
        .values("account_id", "transaction_type")
        .annotate(total=Sum("amount"))
    )
    for row in outgoing:
        amount = row["total"] or ZERO
        if row["transaction_type"] == FinancialTransaction.Type.INCOME:
            balances[row["account_id"]] += amount
        else:
            balances[row["account_id"]] -= amount

    incoming = (
        FinancialTransaction.objects.filter(
            user_id=user_id,
            transaction_type=FinancialTransaction.Type.TRANSFER,
            destination_account_id__in=account_ids,
        )
        .values("destination_account_id")
        .annotate(total=Sum("amount"))
    )
    for row in incoming:
        balances[row["destination_account_id"]] += row["total"] or ZERO
    return balances


def account_balance(account):
    return bulk_account_balances([account])[account.id]


def category_budget_rows(user, selected_month):
    selected_month = month_start(selected_month)
    following_month = next_month(selected_month)
    categories = list(
        Category.objects.filter(group__user=user)
        .select_related("group")
        .order_by("group__position", "group_id", "position", "id")
    )
    category_ids = [category.id for category in categories]

    assigned_month = defaultdict(lambda: ZERO)
    assigned_total = defaultdict(lambda: ZERO)
    for row in (
        BudgetAllocation.objects.filter(category_id__in=category_ids, month__lte=selected_month)
        .values("category_id", "month")
        .annotate(total=Sum("assigned"))
    ):
        amount = row["total"] or ZERO
        assigned_total[row["category_id"]] += amount
        if row["month"] == selected_month:
            assigned_month[row["category_id"]] += amount

    activity_month = defaultdict(lambda: ZERO)
    activity_total = defaultdict(lambda: ZERO)
    for row in (
        FinancialTransaction.objects.filter(
            user=user,
            transaction_type=FinancialTransaction.Type.EXPENSE,
            category_id__in=category_ids,
            date__lt=following_month,
        )
        .values("category_id", "date__year", "date__month")
        .annotate(total=Sum("amount"))
    ):
        amount = -(row["total"] or ZERO)
        activity_total[row["category_id"]] += amount
        if row["date__year"] == selected_month.year and row["date__month"] == selected_month.month:
            activity_month[row["category_id"]] += amount

    for row in (
        FinancialTransaction.objects.filter(
            user=user,
            transaction_type=FinancialTransaction.Type.INCOME,
            category_id__in=category_ids,
            date__lt=following_month,
        )
        .values("category_id", "date__year", "date__month")
        .annotate(total=Sum("amount"))
    ):
        amount = row["total"] or ZERO
        activity_total[row["category_id"]] += amount
        if row["date__year"] == selected_month.year and row["date__month"] == selected_month.month:
            activity_month[row["category_id"]] += amount

    rows = []
    for category in categories:
        rows.append(
            {
                "id": category.id,
                "name": category.name,
                "position": category.position,
                "is_archived": category.is_archived,
                "group": {
                    "id": category.group_id,
                    "name": category.group.name,
                    "position": category.group.position,
                    "is_archived": category.group.is_archived,
                },
                "assigned": assigned_month[category.id],
                "activity": activity_month[category.id],
                "available": assigned_total[category.id] + activity_total[category.id],
            }
        )
    return rows


def ready_to_assign(user, selected_month):
    selected_month = month_start(selected_month)
    following_month = next_month(selected_month)
    opening = (
        Account.objects.filter(
            user=user, account_type__in=[Account.Type.CASH, Account.Type.BANK]
        ).aggregate(total=Sum("opening_balance"))["total"]
        or ZERO
    )
    incomes = (
        FinancialTransaction.objects.filter(
            user=user,
            transaction_type=FinancialTransaction.Type.INCOME,
            category__isnull=True,
            account__account_type__in=[Account.Type.CASH, Account.Type.BANK],
            date__lt=following_month,
        ).aggregate(total=Sum("amount"))["total"]
        or ZERO
    )
    assigned = (
        BudgetAllocation.objects.filter(
            category__group__user=user, month__lte=selected_month
        ).aggregate(total=Sum("assigned"))["total"]
        or ZERO
    )
    return opening + incomes - assigned


def dashboard_payload(user, selected_month, currency):
    selected_month = month_start(selected_month)
    accounts = list(Account.objects.filter(user=user, is_archived=False))
    balances = bulk_account_balances(accounts)
    account_rows = [
        {
            "id": account.id,
            "name": account.name,
            "account_type": account.account_type,
            "balance": balances[account.id],
        }
        for account in accounts
    ]
    category_rows = category_budget_rows(user, selected_month)
    grouped = []
    by_group = {}
    for row in category_rows:
        group_id = row["group"]["id"]
        if group_id not in by_group:
            group = {**row["group"], "categories": []}
            by_group[group_id] = group
            grouped.append(group)
        category = {key: value for key, value in row.items() if key != "group"}
        by_group[group_id]["categories"].append(category)

    return {
        "month": selected_month.isoformat(),
        "currency": currency,
        "accounts": account_rows,
        "total_balance": sum(balances.values(), ZERO),
        "ready_to_assign": ready_to_assign(user, selected_month),
        "groups": grouped,
    }

