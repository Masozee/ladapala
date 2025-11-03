from django.contrib import admin
from .models import (
    RoomType, Room, Guest, Reservation, Payment, Complaint,
    CheckIn, Holiday, InventoryItem, FinancialTransaction, Invoice, InvoiceItem
)
from .models.inventory import PurchaseOrder, PurchaseOrderItem, StockMovement
from .models.amenities import AmenityCategory, AmenityRequest
from .models.housekeeping import CleaningTemplate, CleaningTemplateItem, HousekeepingTask, AmenityUsage
from .models.events import EventBooking, EventPackage, FoodPackage, EventPayment, EventAddOn


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'room_category', 'base_price', 'max_occupancy', 'size_sqm', 'is_active']
    list_filter = ['is_active', 'room_category', 'max_occupancy']
    search_fields = ['name', 'description']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'room_category', 'is_active')
        }),
        ('Pricing & Capacity', {
            'fields': ('base_price', 'max_occupancy', 'size_sqm')
        }),
        ('Guest Room Configuration', {
            'fields': ('bed_configuration',),
            'description': 'Only applicable for Guest Rooms'
        }),
        ('Event Space Configuration', {
            'fields': ('seating_arrangement',),
            'description': 'Only applicable for Event Spaces (Ballrooms/Meeting Rooms)'
        }),
        ('Amenities', {
            'fields': ('amenities',)
        }),
    )


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


# Event Booking Admin
@admin.register(EventPackage)
class EventPackageAdmin(admin.ModelAdmin):
    list_display = ['name', 'package_type', 'base_price', 'max_hours', 'is_active']
    list_filter = ['package_type', 'is_active']
    search_fields = ['name', 'description']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'package_type', 'description', 'base_price', 'is_active')
        }),
        ('Duration & Pricing', {
            'fields': ('max_hours', 'additional_hour_price')
        }),
        ('Inclusions', {
            'fields': (
                'includes_venue', 'includes_sound_system', 'includes_projector',
                'includes_led_screen', 'includes_lighting', 'includes_ac',
                'includes_tables_chairs', 'includes_decoration', 'includes_parking'
            )
        }),
    )


@admin.register(FoodPackage)
class FoodPackageAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price_per_pax', 'minimum_pax', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description', 'menu_items']


@admin.register(EventBooking)
class EventBookingAdmin(admin.ModelAdmin):
    list_display = ['booking_number', 'event_name', 'event_type', 'venue', 'event_date', 'expected_pax', 'grand_total', 'status']
    list_filter = ['event_type', 'status', 'event_date']
    search_fields = ['booking_number', 'event_name', 'guest__full_name', 'organizer_name']
    readonly_fields = ['booking_number', 'created_at', 'updated_at', 'subtotal', 'tax_amount', 'grand_total', 'down_payment_amount', 'remaining_amount']
    date_hierarchy = 'event_date'
    fieldsets = (
        ('Basic Information', {
            'fields': ('booking_number', 'event_name', 'event_type', 'status')
        }),
        ('Contact Information', {
            'fields': ('guest', 'organizer_name', 'organizer_phone', 'organizer_email', 'organization')
        }),
        ('Venue & Time', {
            'fields': ('venue', 'venue_package', 'event_date', 'start_time', 'end_time', 'setup_time')
        }),
        ('Guests & Catering', {
            'fields': ('expected_pax', 'confirmed_pax', 'food_package')
        }),
        ('Pricing', {
            'fields': (
                'venue_price', 'food_price', 'equipment_price', 'other_charges',
                'subtotal', 'tax_amount', 'grand_total'
            )
        }),
        ('Payment Terms', {
            'fields': (
                'down_payment_percentage', 'down_payment_amount', 'remaining_amount',
                'down_payment_paid', 'full_payment_paid'
            )
        }),
        ('Additional Information', {
            'fields': ('special_requests', 'notes', 'invoice_notes')
        }),
        ('Audit', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )


@admin.register(EventPayment)
class EventPaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_number', 'event_booking', 'payment_type', 'amount', 'payment_method', 'status', 'payment_date']
    list_filter = ['payment_type', 'payment_method', 'status', 'payment_date']
    search_fields = ['payment_number', 'event_booking__booking_number', 'reference_number']
    readonly_fields = ['payment_number', 'created_at', 'updated_at']
    date_hierarchy = 'payment_date'


@admin.register(EventAddOn)
class EventAddOnAdmin(admin.ModelAdmin):
    list_display = ['event_booking', 'addon_type', 'name', 'quantity', 'unit_price', 'total_price']
    list_filter = ['addon_type']
    search_fields = ['event_booking__booking_number', 'name']

# Promotion models
from .models import Voucher, Discount, LoyaltyProgram, GuestLoyaltyPoints, LoyaltyTransaction, VoucherUsage

@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'voucher_type', 'status', 'usage_count', 'usage_limit', 'valid_from', 'valid_until']
    list_filter = ['status', 'voucher_type', 'is_public']
    search_fields = ['code', 'name']
    readonly_fields = ['usage_count', 'created_at', 'updated_at']

@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ['name', 'discount_type', 'discount_percentage', 'is_active', 'priority', 'valid_from', 'valid_until']
    list_filter = ['discount_type', 'is_active']
    search_fields = ['name']

@admin.register(LoyaltyProgram)
class LoyaltyProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'points_per_rupiah', 'rupiah_per_point', 'is_active']
    list_filter = ['is_active']

@admin.register(GuestLoyaltyPoints)
class GuestLoyaltyPointsAdmin(admin.ModelAdmin):
    list_display = ['guest', 'total_points', 'lifetime_points', 'updated_at']
    search_fields = ['guest__name', 'guest__email']
    readonly_fields = ['total_points', 'lifetime_points', 'created_at', 'updated_at']

@admin.register(LoyaltyTransaction)
class LoyaltyTransactionAdmin(admin.ModelAdmin):
    list_display = ['guest', 'transaction_type', 'points', 'balance_after', 'created_at']
    list_filter = ['transaction_type']
    search_fields = ['guest__name']
    readonly_fields = ['created_at']

@admin.register(VoucherUsage)
class VoucherUsageAdmin(admin.ModelAdmin):
    list_display = ['voucher', 'guest', 'reservation', 'discount_amount', 'used_at']
    search_fields = ['voucher__code', 'guest__name']
    readonly_fields = ['used_at']
