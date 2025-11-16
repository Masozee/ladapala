from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WarehouseCategoryViewSet,
    SupplierViewSet,
    WarehouseItemViewSet,
    DepartmentBufferViewSet,
    StockTransferViewSet,
    PurchaseOrderViewSet,
    StockAdjustmentViewSet
)

router = DefaultRouter()
router.register(r'categories', WarehouseCategoryViewSet, basename='warehouse-category')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'items', WarehouseItemViewSet, basename='warehouse-item')
router.register(r'buffers', DepartmentBufferViewSet, basename='department-buffer')
router.register(r'transfers', StockTransferViewSet, basename='stock-transfer')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'adjustments', StockAdjustmentViewSet, basename='stock-adjustment')

urlpatterns = [
    path('', include(router.urls)),
]
