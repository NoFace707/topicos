from django.contrib import admin

from .models import Account, BudgetAllocation, Category, CategoryGroup, FinancialTransaction


admin.site.register([Account, CategoryGroup, Category, BudgetAllocation, FinancialTransaction])

