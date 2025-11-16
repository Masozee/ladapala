from django.contrib import admin
from .models import (
    WarehouseCategory, Supplier, WarehouseItem, DepartmentBuffer,
    StockTransfer, PurchaseOrder, PurchaseOrderItem, StockAdjustment
)


@admin.register(WarehouseCategory)
class WarehouseCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'for_hotel', 'for_restaurant', 'is_active']
    list_filter = ['for_hotel', 'for_restaurant', 'is_active']
    search_fields = ['name', 'description']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'phone', 'email', 'rating', 'is_active']
    list_filter = ['is_active', 'rating']
    search_fields = ['name', 'contact_person', 'email']


@admin.register(WarehouseItem)
class WarehouseItemAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'category', 'quantity', 'unit_of_measure', 'cost_per_unit', 'stock_status', 'is_active']
    list_filter = ['category', 'item_type', 'is_active']
    search_fields = ['code', 'name', 'description']
    readonly_fields = ['stock_status', 'stock_value']


@admin.register(DepartmentBuffer)
class DepartmentBufferAdmin(admin.ModelAdmin):
    list_display = ['department', 'warehouse_item', 'current_stock', 'min_stock', 'max_stock', 'is_low_stock']
    list_filter = ['department', 'is_active']
    search_fields = ['warehouse_item__name', 'warehouse_item__code']


@admin.register(StockTransfer)
class StockTransferAdmin(admin.ModelAdmin):
    list_display = ['transfer_number', 'warehouse_item', 'from_department', 'to_department', 'quantity', 'status', 'request_date']
    list_filter = ['status', 'transfer_type', 'to_department']
    search_fields = ['transfer_number', 'warehouse_item__name']
    readonly_fields = ['transfer_number']


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 1


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'supplier', 'status', 'order_date', 'expected_delivery', 'total_amount']
    list_filter = ['status', 'order_date']
    search_fields = ['po_number', 'supplier__name']
    readonly_fields = ['po_number', 'subtotal', 'total_amount']
    inlines = [PurchaseOrderItemInline]


@admin.register(StockAdjustment)
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = ['adjustment_number', 'warehouse_item', 'adjustment_type', 'quantity', 'adjusted_by', 'adjustment_date']
    list_filter = ['adjustment_type', 'adjustment_date']
    search_fields = ['adjustment_number', 'warehouse_item__name']
    readonly_fields = ['adjustment_number']
