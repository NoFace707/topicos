from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AccountViewSet,
    BudgetAllocationViewSet,
    CategoryGroupViewSet,
    CategoryViewSet,
    DashboardView,
    FinancialTransactionViewSet,
)


router = DefaultRouter()
router.register("accounts", AccountViewSet, basename="account")
router.register("groups", CategoryGroupViewSet, basename="category-group")
router.register("categories", CategoryViewSet, basename="category")
router.register("allocations", BudgetAllocationViewSet, basename="allocation")
router.register("transactions", FinancialTransactionViewSet, basename="transaction")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("", include(router.urls)),
]

