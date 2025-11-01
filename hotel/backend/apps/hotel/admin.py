from django.contrib import admin
from .models import (
    RoomType, Room, Guest, Reservation, Payment, Complaint,
    CheckIn, Holiday, InventoryItem, FinancialTransaction, Invoice, InvoiceItem
)
from .models.inventory import PurchaseOrder, PurchaseOrderItem, StockMovement
from .models.amenities import AmenityCategory, AmenityRequest
from .models.housekeeping import CleaningTemplate, CleaningTemplateItem, HousekeepingTask, AmenityUsage


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'base_price', 'max_occupancy', 'size_sqm', 'is_active']
    list_filter = ['is_active', 'max_occupancy']
    search_fields = ['name', 'description']


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['number', 'room_type', 'floor', 'status', 'is_active']
    list_filter = ['room_type', 'status', 'floor', 'is_active']
    search_fields = ['number', 'room_type__name']


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'phone', 'nationality', 'is_vip', 'loyalty_points']
    list_filter = ['is_vip', 'nationality', 'gender']
    search_fields = ['first_name', 'last_name', 'email', 'phone']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['reservation_number', 'guest', 'room', 'check_in_date', 'check_out_date', 'status']
    list_filter = ['status', 'booking_source', 'check_in_date']
    search_fields = ['reservation_number', 'guest__first_name', 'guest__last_name']
    date_hierarchy = 'check_in_date'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['reservation', 'amount', 'payment_method', 'status', 'payment_date']
    list_filter = ['payment_method', 'status', 'payment_date']
    search_fields = ['reservation__reservation_number', 'transaction_id']


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['complaint_number', 'title', 'category', 'priority', 'status', 'created_at']
    list_filter = ['category', 'priority', 'status', 'created_at']
    search_fields = ['complaint_number', 'title', 'description']


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ['reservation', 'actual_check_in_time', 'status', 'room_key_issued']
    list_filter = ['status', 'early_check_in', 'late_check_in', 'room_key_issued']
    search_fields = ['reservation__reservation_number', 'reservation__guest__first_name']


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_id', 'date', 'holiday_type', 'is_work_day']
    list_filter = ['holiday_type', 'is_work_day', 'date']
    search_fields = ['name', 'name_id', 'description']
    date_hierarchy = 'date'


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'current_stock', 'minimum_stock', 'unit_price', 'is_low_stock']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description', 'supplier']


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'supplier', 'order_date', 'status', 'total_amount', 'created_by']
    list_filter = ['status', 'order_date', 'supplier']
    search_fields = ['po_number', 'supplier', 'notes']
    readonly_fields = ['po_number', 'created_at', 'updated_at']


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 1
    fields = ['inventory_item', 'quantity_ordered', 'unit_price', 'quantity_received', 'notes']


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['inventory_item', 'movement_type', 'quantity', 'balance_after', 'reference', 'movement_date', 'created_by']
    list_filter = ['movement_type', 'movement_date']
    search_fields = ['inventory_item__name', 'reference', 'notes']
    readonly_fields = ['created_at']


@admin.register(FinancialTransaction)
class FinancialTransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'transaction_type', 'category', 'amount', 'status', 'transaction_date']
    list_filter = ['transaction_type', 'status', 'category', 'payment_method', 'transaction_date']
    search_fields = ['transaction_id', 'description', 'reference_number']
    date_hierarchy = 'transaction_date'


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'guest', 'total_amount', 'balance', 'status', 'issue_date', 'due_date']
    list_filter = ['status', 'issue_date']
    search_fields = ['invoice_number', 'guest__first_name', 'guest__last_name']
    date_hierarchy = 'issue_date'


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'description', 'quantity', 'rate', 'amount']
    search_fields = ['invoice__invoice_number', 'description']


@admin.register(AmenityCategory)
class AmenityCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']


@admin.register(AmenityRequest)
class AmenityRequestAdmin(admin.ModelAdmin):
    list_display = ['request_number', 'guest_name', 'room_number', 'item', 'category', 'quantity', 'status', 'priority', 'requested_at']
    list_filter = ['status', 'priority', 'category', 'requested_at']
    search_fields = ['request_number', 'guest_name', 'room_number', 'item']
    readonly_fields = ['request_number', 'created_at', 'updated_at', 'delivered_at']
    date_hierarchy = 'requested_at'


class CleaningTemplateItemInline(admin.TabularInline):
    model = CleaningTemplateItem
    extra = 1
    fields = ['inventory_item', 'quantity', 'is_optional', 'notes', 'sort_order']
    autocomplete_fields = ['inventory_item']


@admin.register(CleaningTemplate)
class CleaningTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'task_type', 'room_type', 'is_active', 'created_at']
    list_filter = ['task_type', 'room_type', 'is_active']
    search_fields = ['name', 'description']
    inlines = [CleaningTemplateItemInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(CleaningTemplateItem)
class CleaningTemplateItemAdmin(admin.ModelAdmin):
    list_display = ['template', 'inventory_item', 'quantity', 'is_optional', 'sort_order']
    list_filter = ['template__task_type', 'is_optional']
    search_fields = ['template__name', 'inventory_item__name']
    autocomplete_fields = ['template', 'inventory_item']


@admin.register(HousekeepingTask)
class HousekeepingTaskAdmin(admin.ModelAdmin):
    list_display = ['task_number', 'room', 'task_type', 'status', 'priority', 'assigned_to', 'scheduled_date']
    list_filter = ['task_type', 'status', 'priority', 'scheduled_date']
    search_fields = ['task_number', 'room__number']
    readonly_fields = ['task_number', 'created_at', 'updated_at']
    date_hierarchy = 'scheduled_date'


@admin.register(AmenityUsage)
class AmenityUsageAdmin(admin.ModelAdmin):
    list_display = ['housekeeping_task', 'inventory_item', 'quantity_used', 'stock_deducted', 'recorded_by', 'recorded_at']
    list_filter = ['stock_deducted', 'recorded_at']
    search_fields = ['housekeeping_task__task_number', 'inventory_item__name']
    readonly_fields = ['recorded_at', 'stock_deducted']
    date_hierarchy = 'recorded_at'
