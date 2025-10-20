from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import (
    RestaurantViewSet, BranchViewSet, StaffViewSet,
    CategoryViewSet, ProductViewSet, InventoryViewSet,
    InventoryTransactionViewSet, OrderViewSet, OrderItemViewSet, PaymentViewSet,
    TableViewSet, KitchenOrderViewSet, PromotionViewSet,
    ScheduleViewSet, DashboardViewSet, CashierSessionViewSet,
    RecipeViewSet, RecipeIngredientViewSet, PurchaseOrderViewSet, PurchaseOrderItemViewSet,
    StockTransferViewSet, VendorViewSet
)
from .reports import ReportViewSet

router = DefaultRouter()
router.register(r'restaurants', RestaurantViewSet)
router.register(r'branches', BranchViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'inventory-transactions', InventoryTransactionViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order-items', OrderItemViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'tables', TableViewSet)
router.register(r'kitchen-orders', KitchenOrderViewSet)
router.register(r'promotions', PromotionViewSet)
router.register(r'schedules', ScheduleViewSet)
router.register(r'reports', ReportViewSet, basename='reports')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'cashier-sessions', CashierSessionViewSet)
router.register(r'recipes', RecipeViewSet)
router.register(r'recipe-ingredients', RecipeIngredientViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'purchase-order-items', PurchaseOrderItemViewSet)
router.register(r'stock-transfers', StockTransferViewSet)
router.register(r'vendors', VendorViewSet, basename='vendor')

app_name = 'restaurant'

urlpatterns = [
    path('', include(router.urls)),
]