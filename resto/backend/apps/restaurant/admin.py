from django.contrib import admin
from .models import (
    Restaurant, Branch, Staff,
    Category, Product, Inventory, InventoryTransaction,
    Order, OrderItem, Payment, Table,
    KitchenOrder, KitchenOrderItem,
    Promotion, Schedule, Report, CashierSession, SessionAuditLog,
    PurchaseOrder, PurchaseOrderItem
)


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ['id','name', 'email', 'phone', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'email']


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['name', 'restaurant', 'phone', 'is_active', 'created_at']
    list_filter = ['restaurant', 'is_active', 'created_at']
    search_fields = ['name', 'address']


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ['user', 'branch', 'role', 'employee_id', 'is_active']
    list_filter = ['role', 'branch', 'is_active']
    search_fields = ['user__username', 'employee_id']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'restaurant', 'display_order', 'is_active']
    list_filter = ['restaurant', 'is_active']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'cost', 'is_available', 'sku']
    list_filter = ['category', 'is_available', 'restaurant']
    search_fields = ['name', 'sku', 'description']


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'branch', 'quantity', 'unit', 'min_quantity', 'needs_restock']
    list_filter = ['branch']
    search_fields = ['name', 'supplier']


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ['inventory', 'transaction_type', 'quantity', 'performed_by', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['inventory__name', 'reference_number']


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ['number', 'branch', 'capacity', 'is_available']
    list_filter = ['branch', 'is_available']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'branch', 'order_type', 'status', 'total_amount', 'created_at']
    list_filter = ['branch', 'order_type', 'status', 'created_at']
    search_fields = ['order_number', 'customer_name', 'customer_phone']
    readonly_fields = ['order_number', 'total_amount']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'unit_price', 'subtotal']
    list_filter = ['order__branch', 'created_at']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'order', 'amount', 'payment_method', 'status', 'created_at']
    list_filter = ['payment_method', 'status', 'created_at']
    search_fields = ['transaction_id', 'order__order_number']
    readonly_fields = ['transaction_id']


@admin.register(KitchenOrder)
class KitchenOrderAdmin(admin.ModelAdmin):
    list_display = ['order', 'status', 'priority', 'assigned_to', 'created_at']
    list_filter = ['status', 'created_at']


@admin.register(KitchenOrderItem)
class KitchenOrderItemAdmin(admin.ModelAdmin):
    list_display = ['kitchen_order', 'product', 'quantity', 'status']
    list_filter = ['status']


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ['name', 'promo_code', 'discount_type', 'discount_value', 'is_active', 'start_date', 'end_date']
    list_filter = ['discount_type', 'promo_type', 'is_active']
    search_fields = ['name', 'promo_code']
    readonly_fields = ['promo_code', 'used_count']


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ['staff', 'date', 'shift_type', 'start_time', 'end_time', 'is_confirmed']
    list_filter = ['shift_type', 'date', 'is_confirmed']
    search_fields = ['staff__user__username']


@admin.register(CashierSession)
class CashierSessionAdmin(admin.ModelAdmin):
    list_display = ['cashier', 'branch', 'shift_type', 'status', 'opened_at', 'closed_at', 'opening_cash', 'cash_difference', 'override_by']
    list_filter = ['status', 'shift_type', 'branch', 'opened_at']
    search_fields = ['cashier__user__username', 'cashier__employee_id']
    readonly_fields = ['opened_at', 'closed_at', 'expected_cash', 'cash_difference', 'settlement_data']


@admin.register(SessionAuditLog)
class SessionAuditLogAdmin(admin.ModelAdmin):
    list_display = ['session', 'event_type', 'performed_by', 'timestamp']
    list_filter = ['event_type', 'timestamp']
    search_fields = ['session__cashier__user__username', 'performed_by__user__username']
    readonly_fields = ['timestamp']


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['report_type', 'branch', 'start_date', 'end_date', 'generated_by', 'created_at']
    list_filter = ['report_type', 'branch', 'created_at']


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 1
    fields = ['inventory_item', 'quantity', 'unit_price', 'total_price', 'notes']
    readonly_fields = ['total_price']


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'supplier_name', 'status', 'order_date', 'total_items', 'total_amount', 'created_by']
    list_filter = ['status', 'branch', 'order_date', 'created_at']
    search_fields = ['po_number', 'supplier_name', 'supplier_contact']
    readonly_fields = ['po_number', 'total_amount', 'total_items', 'created_at', 'updated_at']
    inlines = [PurchaseOrderItemInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('po_number', 'branch', 'status')
        }),
        ('Supplier Details', {
            'fields': ('supplier_name', 'supplier_contact', 'supplier_email', 'supplier_phone')
        }),
        ('Dates', {
            'fields': ('order_date', 'expected_delivery_date', 'actual_delivery_date')
        }),
        ('Staff & Approval', {
            'fields': ('created_by', 'approved_by', 'received_by')
        }),
        ('Additional Information', {
            'fields': ('notes', 'terms_and_conditions', 'total_items', 'total_amount')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PurchaseOrderItem)
class PurchaseOrderItemAdmin(admin.ModelAdmin):
    list_display = ['purchase_order', 'inventory_item', 'quantity', 'unit_price', 'total_price']
    list_filter = ['purchase_order__status', 'purchase_order__branch']
    search_fields = ['purchase_order__po_number', 'inventory_item__name']
    readonly_fields = ['total_price']
