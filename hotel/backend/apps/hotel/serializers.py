from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    RoomType, Room, RoomTypeImage, Guest, Reservation, Payment, AdditionalCharge, Complaint, ComplaintImage,
    CheckIn, Holiday, InventoryItem, PurchaseOrder, PurchaseOrderItem, StockMovement, Supplier,
    MaintenanceRequest, MaintenanceTechnician, HousekeepingTask, AmenityUsage,
    FinancialTransaction, Invoice, InvoiceItem, AmenityRequest, AmenityCategory, HotelSettings
)


class RoomTypeSerializer(serializers.ModelSerializer):
    """Serializer for room types"""
    total_rooms = serializers.SerializerMethodField()
    available_rooms_count = serializers.SerializerMethodField()
    occupied_rooms_count = serializers.SerializerMethodField()
    occupancy_percentage = serializers.SerializerMethodField()
    bed_configuration = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = RoomType
        fields = [
            'id', 'name', 'description', 'base_price', 'max_occupancy',
            'size_sqm', 'amenities', 'room_category', 'is_active', 'created_at', 'updated_at',
            'total_rooms', 'available_rooms_count', 'occupied_rooms_count',
            'occupancy_percentage', 'bed_configuration', 'images'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_total_rooms(self, obj):
        """Get total number of rooms for this room type"""
        return obj.rooms.filter(is_active=True).count()

    def get_available_rooms_count(self, obj):
        """Get count of available rooms for a date range if provided"""
        # Check if date range parameters are provided in the request context
        request = self.context.get('request')
        if request:
            check_in = request.query_params.get('check_in')
            check_out = request.query_params.get('check_out')

            if check_in and check_out:
                from datetime import datetime
                from django.db.models import Q

                try:
                    check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
                    check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()

                    # Get all active rooms of this type
                    all_rooms = obj.rooms.filter(is_active=True)
                    total_rooms = all_rooms.count()

                    # Find rooms with overlapping reservations in the date range
                    # A reservation overlaps if:
                    # - Its check_in is before our check_out AND
                    # - Its check_out is after our check_in
                    occupied_room_ids = Reservation.objects.filter(
                        Q(room__room_type=obj) &
                        Q(check_in_date__lt=check_out_date) &
                        Q(check_out_date__gt=check_in_date) &
                        ~Q(status__in=['CANCELLED', 'NO_SHOW', 'CHECKED_OUT'])
                    ).values_list('room_id', flat=True).distinct()

                    # Available rooms = total rooms - occupied rooms
                    available_count = total_rooms - len(set(occupied_room_ids))
                    return max(0, available_count)

                except (ValueError, TypeError):
                    # If date parsing fails, fall back to current status
                    pass

        # Default: return currently available rooms
        return obj.rooms.filter(status='AVAILABLE', is_active=True).count()

    def get_occupied_rooms_count(self, obj):
        """Get count of occupied rooms"""
        return obj.rooms.filter(status='OCCUPIED', is_active=True).count()

    def get_occupancy_percentage(self, obj):
        """Calculate occupancy percentage"""
        total = self.get_total_rooms(obj)
        if total == 0:
            return 0
        occupied = self.get_occupied_rooms_count(obj)
        return round((occupied / total) * 100, 2)

    def get_bed_configuration(self, obj):
        """Return bed configuration or seating arrangement based on room category"""
        if obj.room_category == 'EVENT_SPACE':
            # For event spaces, return seating arrangement
            if obj.seating_arrangement:
                return obj.get_seating_arrangement_display()
            return 'Mixed Arrangement'
        else:
            # For guest rooms, return bed configuration
            if obj.bed_configuration:
                return obj.get_bed_configuration_display()
            return '1 King Bed'

    def get_images(self, obj):
        """Return room images from RoomTypeImage model"""
        room_images = RoomTypeImage.objects.filter(room_type=obj)
        request = self.context.get('request')

        if not room_images.exists():
            # Return placeholder if no images
            return ['/hotelroom.jpeg']

        # Return full URLs for images
        image_urls = []
        for room_image in room_images:
            if room_image.image and request:
                image_urls.append(request.build_absolute_uri(room_image.image.url))
            elif room_image.image:
                image_urls.append(room_image.image.url)

        return image_urls if image_urls else ['/hotelroom.jpeg']


class RoomSerializer(serializers.ModelSerializer):
    """Serializer for rooms"""
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    room_type_details = RoomTypeSerializer(source='room_type', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    base_price = serializers.DecimalField(source='room_type.base_price', max_digits=10, decimal_places=2, read_only=True)
    max_occupancy = serializers.IntegerField(source='room_type.max_occupancy', read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'number', 'room_type', 'room_type_name', 'room_type_details',
            'floor', 'status', 'status_display', 'notes', 'is_active',
            'base_price', 'max_occupancy',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class GuestSerializer(serializers.ModelSerializer):
    """Serializer for guests"""
    full_name = serializers.CharField(read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    id_type_display = serializers.CharField(source='get_id_type_display', read_only=True)

    class Meta:
        model = Guest
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'date_of_birth', 'gender', 'gender_display', 'nationality',
            'id_type', 'id_type_display', 'id_number', 'address',
            'preferences', 'allergies',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'is_vip', 'loyalty_points', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'full_name']


class ReservationSerializer(serializers.ModelSerializer):
    """Serializer for reservations"""
    guest_name = serializers.CharField(source='guest.full_name', read_only=True)
    guest_details = GuestSerializer(source='guest', read_only=True)
    room_number = serializers.CharField(source='room.number', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    booking_source_display = serializers.CharField(source='get_booking_source_display', read_only=True)
    nights = serializers.IntegerField(read_only=True)

    # Computed financial fields
    subtotal = serializers.SerializerMethodField()
    taxes = serializers.SerializerMethodField()
    service_charge = serializers.SerializerMethodField()
    additional_charges_total = serializers.SerializerMethodField()
    additional_charges = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()
    deposit_amount = serializers.SerializerMethodField()
    balance_due = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()
    is_fully_paid = serializers.SerializerMethodField()

    # Additional info
    can_cancel = serializers.SerializerMethodField()
    total_rooms = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            'id', 'reservation_number', 'guest', 'guest_name', 'guest_details',
            'room', 'room_number', 'room_details', 'check_in_date', 'check_out_date',
            'nights', 'adults', 'children', 'status', 'status_display',
            'booking_source', 'booking_source_display', 'special_requests', 'notes',
            'total_amount', 'subtotal', 'taxes', 'service_charge',
            'additional_charges_total', 'additional_charges', 'grand_total',
            'deposit_amount', 'balance_due', 'total_paid', 'is_fully_paid',
            'can_cancel', 'total_rooms', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'reservation_number', 'nights']

    def get_subtotal(self, obj):
        """Calculate subtotal (room rate * nights)"""
        if obj.room and obj.room.room_type:
            return float(obj.room.room_type.base_price * obj.nights)
        return float(obj.total_amount) if obj.total_amount else 0.0

    def get_taxes(self, obj):
        """Calculate taxes (11% VAT)"""
        subtotal = self.get_subtotal(obj)
        return round(subtotal * 0.11, 2)

    def get_service_charge(self, obj):
        """Service charge (currently 0)"""
        return 0.0

    def get_additional_charges_total(self, obj):
        """Calculate total additional charges"""
        return float(obj.get_additional_charges_total())

    def get_additional_charges(self, obj):
        """Get all additional charges for this reservation"""
        charges = obj.additional_charges.all()
        return AdditionalChargeSerializer(charges, many=True).data

    def get_grand_total(self, obj):
        """Calculate grand total (subtotal + taxes + service charge + additional charges)"""
        subtotal = self.get_subtotal(obj)
        taxes = self.get_taxes(obj)
        service_charge = self.get_service_charge(obj)
        additional_charges = self.get_additional_charges_total(obj)
        return round(subtotal + taxes + service_charge + additional_charges, 2)

    def get_deposit_amount(self, obj):
        """Get deposit amount (currently 0, can be enhanced later)"""
        return 0.0

    def get_balance_due(self, obj):
        """Calculate balance due"""
        grand_total = self.get_grand_total(obj)
        total_paid = self.get_total_paid(obj)
        return round(grand_total - total_paid, 2)

    def get_total_paid(self, obj):
        """Get total amount paid for this reservation"""
        return float(obj.get_total_paid())

    def get_is_fully_paid(self, obj):
        """Check if reservation is fully paid"""
        return obj.is_fully_paid()

    def get_can_cancel(self, obj):
        """Check if reservation can be cancelled"""
        return obj.status in ['PENDING', 'CONFIRMED']

    def get_total_rooms(self, obj):
        """Total number of rooms (currently always 1)"""
        return 1 if obj.room else 0

    def validate(self, data):
        """Validate reservation data"""
        check_in = data.get('check_in_date')
        check_out = data.get('check_out_date')

        if check_in and check_out and check_out <= check_in:
            raise serializers.ValidationError("Check-out date must be after check-in date")

        return data


class AdditionalChargeSerializer(serializers.ModelSerializer):
    """Serializer for additional charges"""
    reservation_number = serializers.CharField(source='reservation.reservation_number', read_only=True)
    charge_type_display = serializers.CharField(source='get_charge_type_display', read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    charged_by_name = serializers.CharField(source='charged_by.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = AdditionalCharge
        fields = [
            'id', 'reservation', 'reservation_number', 'charge_type', 'charge_type_display',
            'description', 'amount', 'quantity', 'total_amount', 'is_paid',
            'charged_at', 'charged_by', 'charged_by_name', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['charged_at', 'created_at', 'updated_at', 'total_amount']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments"""
    reservation_number = serializers.CharField(source='reservation.reservation_number', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    guest_name = serializers.CharField(source='reservation.guest.full_name', read_only=True)
    room_number = serializers.CharField(source='reservation.room.number', read_only=True)
    check_in_date = serializers.DateField(source='reservation.check_in_date', read_only=True)
    check_out_date = serializers.DateField(source='reservation.check_out_date', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'reservation', 'reservation_number', 'guest_name', 'room_number',
            'check_in_date', 'check_out_date', 'amount', 'payment_method',
            'payment_method_display', 'status', 'status_display', 'payment_date',
            'transaction_id', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ComplaintImageSerializer(serializers.ModelSerializer):
    """Serializer for complaint images"""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintImage
        fields = ['id', 'complaint', 'image', 'image_url', 'caption', 'is_evidence', 'uploaded_by', 'created_at']
        read_only_fields = ['created_at', 'uploaded_by', 'image_url']

    def get_image_url(self, obj):
        """Get the full URL for the image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ComplaintSerializer(serializers.ModelSerializer):
    """Serializer for complaints"""
    guest_name = serializers.CharField(source='guest.full_name', read_only=True)
    guest_details = GuestSerializer(source='guest', read_only=True)
    room_number = serializers.CharField(source='room.number', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_team_display = serializers.CharField(source='get_assigned_team_display', read_only=True)
    images = ComplaintImageSerializer(many=True, read_only=True)
    image_count = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id', 'complaint_number', 'title', 'description', 'category',
            'category_display', 'priority', 'priority_display', 'status',
            'status_display', 'guest', 'guest_name', 'guest_details', 'room', 'room_number',
            'incident_date', 'assigned_to', 'assigned_to_name', 'assigned_team', 'assigned_team_display',
            'resolution', 'resolved_at', 'images', 'image_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'complaint_number', 'image_count', 'assigned_to_name', 'assigned_team_display']

    def get_image_count(self, obj):
        """Get count of images for this complaint"""
        return obj.images.count()

    def get_assigned_to_name(self, obj):
        """Get name of assigned staff member"""
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return None


class CheckInSerializer(serializers.ModelSerializer):
    """Serializer for check-ins"""
    reservation_number = serializers.CharField(source='reservation.reservation_number', read_only=True)
    guest_name = serializers.CharField(source='reservation.guest.full_name', read_only=True)
    room_number = serializers.CharField(source='reservation.room.number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CheckIn
        fields = [
            'id', 'reservation', 'reservation_number', 'guest_name', 'room_number',
            'actual_check_in_time', 'status', 'status_display', 'early_check_in',
            'late_check_in', 'room_key_issued', 'id_verified', 'deposit_collected',
            'special_instructions', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class HolidaySerializer(serializers.ModelSerializer):
    """Serializer for holidays"""
    holiday_type_display = serializers.CharField(source='get_holiday_type_display', read_only=True)
    is_today = serializers.SerializerMethodField()
    is_this_month = serializers.SerializerMethodField()
    
    class Meta:
        model = Holiday
        fields = [
            'id', 'name', 'name_id', 'date', 'holiday_type', 'holiday_type_display',
            'description', 'is_work_day', 'is_today', 'is_this_month',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_is_today(self, obj):
        from datetime import date
        return obj.date == date.today()
    
    def get_is_this_month(self, obj):
        from datetime import date
        today = date.today()
        return obj.date.year == today.year and obj.date.month == today.month


class InventoryItemSerializer(serializers.ModelSerializer):
    """Serializer for inventory items"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_status = serializers.CharField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    unit_of_measurement = serializers.CharField(default='pieces')
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'name', 'description', 'category', 'category_name',
            'current_stock', 'minimum_stock', 'maximum_stock', 'unit_price',
            'unit_of_measurement', 'supplier', 'supplier_name', 'last_restocked', 'stock_status',
            'is_low_stock', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'stock_status', 'is_low_stock', 'supplier_name', 'category_name']


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    """Serializer for purchase order items"""
    inventory_item_name = serializers.CharField(source='inventory_item.name', read_only=True)
    inventory_item_unit = serializers.CharField(source='inventory_item.unit_of_measurement', read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    is_fully_received = serializers.BooleanField(read_only=True)
    quantity_pending = serializers.IntegerField(read_only=True)
    purchase_order = serializers.PrimaryKeyRelatedField(
        queryset=PurchaseOrder.objects.all(),
        required=False  # Make optional for add_item action
    )

    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'purchase_order', 'inventory_item', 'inventory_item_name',
            'inventory_item_unit', 'quantity_ordered', 'unit_price',
            'quantity_received', 'subtotal', 'is_fully_received',
            'quantity_pending', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'subtotal', 'is_fully_received', 'quantity_pending']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    """Serializer for purchase orders"""
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    received_by_name = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'supplier', 'supplier_name', 'order_date', 'expected_delivery',
            'status', 'status_display', 'notes', 'total_amount', 'items',
            'items_count', 'created_by', 'created_by_name', 'received_by',
            'received_by_name', 'received_date', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'po_number', 'created_at', 'updated_at', 'received_date',
            'status_display', 'supplier_name', 'created_by_name', 'received_by_name', 'items_count'
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def get_received_by_name(self, obj):
        if obj.received_by:
            return f"{obj.received_by.first_name} {obj.received_by.last_name}".strip() or obj.received_by.username
        return None

    def get_items_count(self, obj):
        return obj.items.count()


class StockMovementSerializer(serializers.ModelSerializer):
    """Serializer for stock movements"""
    inventory_item_name = serializers.CharField(source='inventory_item.name', read_only=True)
    inventory_item_unit = serializers.CharField(source='inventory_item.unit_of_measurement', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockMovement
        fields = [
            'id', 'inventory_item', 'inventory_item_name', 'inventory_item_unit',
            'movement_type', 'movement_type_display', 'quantity', 'balance_after',
            'reference', 'notes', 'movement_date', 'created_by', 'created_by_name',
            'created_at'
        ]
        read_only_fields = ['created_at', 'created_by_name', 'movement_type_display']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


# List serializers for simplified views
class RoomListSerializer(serializers.ModelSerializer):
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    base_price = serializers.DecimalField(source='room_type.base_price', max_digits=10, decimal_places=2, read_only=True)
    max_occupancy = serializers.IntegerField(source='room_type.max_occupancy', read_only=True)

    # Current guest if occupied
    current_guest = serializers.SerializerMethodField()

    # Current staff working on room
    current_staff = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ['id', 'number', 'room_type_name', 'floor', 'status', 'status_display',
                  'base_price', 'max_occupancy', 'is_active', 'current_guest', 'current_staff']

    def get_current_guest(self, obj):
        """Get current guest if room is occupied"""
        from .models import Reservation

        # Get active reservation (CHECKED_IN)
        reservation = Reservation.objects.filter(
            room=obj,
            status='CHECKED_IN'
        ).select_related('guest').first()

        if reservation and reservation.guest:
            return {
                'id': reservation.guest.id,
                'name': reservation.guest.full_name,
                'email': reservation.guest.email,
                'phone': reservation.guest.phone,
                'check_in_date': reservation.check_in_date,
                'check_out_date': reservation.check_out_date,
            }
        return None

    def get_current_staff(self, obj):
        """Get current staff working on room (housekeeping or maintenance)"""
        from .models import HousekeepingTask
        from apps.user.models import User

        # Get active housekeeping task (not CLEAN)
        # DIRTY = assigned but not started, CLEANING = in progress, INSPECTING = being inspected, MAINTENANCE = maintenance work
        task = HousekeepingTask.objects.filter(
            room=obj,
            status__in=['DIRTY', 'CLEANING', 'INSPECTING', 'MAINTENANCE']
        ).select_related('assigned_to').order_by('-created_at').first()

        if task and task.assigned_to:
            staff = task.assigned_to
            return {
                'id': staff.id,
                'name': staff.get_full_name() or staff.email,
                'role': staff.staff.role if hasattr(staff, 'staff') else None,
                'task_type': task.task_type,
                'task_type_display': task.get_task_type_display(),
                'task_status': task.status,
                'task_status_display': task.get_status_display(),
                'task_number': task.task_number,
                'started_at': task.actual_start_time,
                'priority': task.priority,
            }

        return None


class GuestListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    loyalty_level = serializers.SerializerMethodField()

    class Meta:
        model = Guest
        fields = ['id', 'full_name', 'email', 'phone', 'nationality', 'is_vip', 'gender_display', 'loyalty_points', 'loyalty_level']

    def get_loyalty_level(self, obj):
        """Calculate loyalty level based on points"""
        points = obj.loyalty_points
        if points >= 5000:
            return 'Diamond'
        elif points >= 2500:
            return 'Platinum'
        elif points >= 1000:
            return 'Gold'
        elif points >= 500:
            return 'Silver'
        else:
            return 'Bronze'


class ReservationListSerializer(serializers.ModelSerializer):
    guest_name = serializers.CharField(source='guest.full_name', read_only=True)
    room_number = serializers.CharField(source='room.number', read_only=True)
    room_type_name = serializers.CharField(source='room.room_type.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    booking_source_display = serializers.CharField(source='get_booking_source_display', read_only=True)
    nights = serializers.IntegerField(read_only=True)
    total_guests = serializers.SerializerMethodField()
    is_fully_paid = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            'id', 'reservation_number', 'guest_name', 'room_number', 'room_type_name',
            'check_in_date', 'check_out_date', 'nights', 'adults', 'children',
            'total_guests', 'status', 'status_display', 'booking_source',
            'booking_source_display', 'is_fully_paid', 'created_at'
        ]

    def get_total_guests(self, obj):
        """Calculate total number of guests (adults + children)"""
        return obj.adults + obj.children

    def get_is_fully_paid(self, obj):
        """Check if reservation is fully paid"""
        return obj.is_fully_paid()


class HolidayListSerializer(serializers.ModelSerializer):
    holiday_type_display = serializers.CharField(source='get_holiday_type_display', read_only=True)
    is_today = serializers.SerializerMethodField()
    
    class Meta:
        model = Holiday
        fields = ['id', 'name', 'date', 'holiday_type', 'holiday_type_display', 'is_today']
    
    def get_is_today(self, obj):
        from datetime import date
        return obj.date == date.today()

class MaintenanceTechnicianSerializer(serializers.ModelSerializer):
    """Serializer for maintenance technicians"""
    total_requests_completed = serializers.ReadOnlyField()
    average_resolution_time = serializers.ReadOnlyField()
    average_efficiency_score = serializers.ReadOnlyField()
    average_customer_satisfaction = serializers.ReadOnlyField()
    
    class Meta:
        model = MaintenanceTechnician
        fields = [
            'id', 'name', 'specializations', 'contact_number', 'email',
            'is_active', 'total_requests_completed', 'average_resolution_time',
            'average_efficiency_score', 'average_customer_satisfaction',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MaintenanceRequestSerializer(serializers.ModelSerializer):
    """Serializer for maintenance requests"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    room_number = serializers.CharField(source='room.number', read_only=True)
    guest_name = serializers.CharField(source='guest.full_name', read_only=True)
    resolution_time_hours = serializers.ReadOnlyField()
    efficiency_score = serializers.ReadOnlyField()

    class Meta:
        model = MaintenanceRequest
        fields = [
            'id', 'request_number', 'room', 'room_number', 'guest', 'guest_name',
            'category', 'category_display', 'priority', 'priority_display',
            'status', 'status_display', 'source', 'source_display',
            'title', 'description', 'assigned_technician', 'technician_notes',
            'requested_date', 'acknowledged_date', 'started_date', 'completed_date',
            'estimated_cost', 'actual_cost', 'customer_satisfaction',
            'resolution_time_hours', 'efficiency_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'request_number']


class AmenityUsageSerializer(serializers.ModelSerializer):
    """Serializer for amenity usage records"""
    inventory_item_name = serializers.CharField(source='inventory_item.name', read_only=True)
    inventory_item_category = serializers.CharField(source='inventory_item.category', read_only=True)
    unit_price = serializers.DecimalField(source='inventory_item.unit_price', max_digits=10, decimal_places=2, read_only=True)
    total_cost = serializers.ReadOnlyField()
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = AmenityUsage
        fields = [
            'id', 'housekeeping_task', 'inventory_item', 'inventory_item_name',
            'inventory_item_category', 'quantity_used', 'unit_price', 'total_cost',
            'notes', 'recorded_by', 'recorded_by_name', 'recorded_at', 'stock_deducted'
        ]
        read_only_fields = ['recorded_at', 'stock_deducted', 'total_cost']


class HousekeepingTaskSerializer(serializers.ModelSerializer):
    """Serializer for housekeeping tasks"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)
    room_number = serializers.CharField(source='room.number', read_only=True)
    room_type = serializers.CharField(source='room.room_type.name', read_only=True)
    floor = serializers.IntegerField(source='room.floor', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True, allow_null=True)
    inspector_name = serializers.CharField(source='inspector.get_full_name', read_only=True, allow_null=True)
    duration_minutes = serializers.ReadOnlyField()
    time_until_deadline = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    amenity_usages = AmenityUsageSerializer(many=True, read_only=True)
    complaint_number = serializers.CharField(source='complaint.complaint_number', read_only=True, allow_null=True)
    complaint_title = serializers.CharField(source='complaint.title', read_only=True, allow_null=True)

    class Meta:
        model = HousekeepingTask
        fields = [
            'id', 'task_number', 'room', 'room_number', 'room_type', 'floor',
            'task_type', 'task_type_display', 'status', 'status_display',
            'priority', 'priority_display', 'assigned_to', 'assigned_to_name',
            'inspector', 'inspector_name', 'scheduled_date', 'estimated_duration_minutes',
            'actual_start_time', 'completion_time', 'estimated_completion',
            'guest_checkout', 'next_guest_checkin', 'notes', 'guest_requests',
            'maintenance_issues', 'inspection_passed', 'inspection_notes',
            'inspection_time', 'duration_minutes', 'time_until_deadline',
            'is_overdue', 'amenity_usages', 'complaint', 'complaint_number',
            'complaint_title', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'task_number', 'duration_minutes', 'time_until_deadline', 'is_overdue']


class FinancialTransactionSerializer(serializers.ModelSerializer):
    """Serializer for financial transactions"""
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    guest_name = serializers.CharField(source='guest.full_name', read_only=True, allow_null=True)
    reservation_number = serializers.CharField(source='reservation.reservation_number', read_only=True, allow_null=True)
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = FinancialTransaction
        fields = [
            'id', 'transaction_id', 'transaction_type', 'transaction_type_display',
            'category', 'description', 'amount', 'payment_method', 'payment_method_display',
            'status', 'status_display', 'reference_number', 'reservation', 'reservation_number',
            'guest', 'guest_name', 'processed_by', 'processed_by_name',
            'transaction_date', 'transaction_time', 'notes', 'receipt_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'transaction_id']


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for invoice line items"""
    class Meta:
        model = InvoiceItem
        fields = ['id', 'invoice', 'description', 'quantity', 'rate', 'amount']
        read_only_fields = ['amount']


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for invoices"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    guest_name = serializers.CharField(source='guest.full_name', read_only=True)
    guest_details = GuestSerializer(source='guest', read_only=True)
    reservation_number = serializers.CharField(source='reservation.reservation_number', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'reservation', 'reservation_number',
            'guest', 'guest_name', 'guest_details', 'issue_date', 'due_date',
            'payment_date', 'subtotal', 'tax_amount', 'service_charge',
            'discount', 'total_amount', 'paid_amount', 'balance',
            'status', 'status_display', 'payment_method', 'notes',
            'terms_and_conditions', 'items', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'invoice_number', 'balance']


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for suppliers"""
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Supplier
        fields = [
            "id", "name", "contact_person", "email", "phone",
            "address", "city", "province", "postal_code", "country",
            "tax_id", "payment_terms", "status", "notes",
            "created_at", "updated_at", "created_by", "created_by_name"
        ]
        read_only_fields = ["created_at", "updated_at"]
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None



class AmenityCategorySerializer(serializers.ModelSerializer):
    """Serializer for amenity categories"""
    class Meta:
        model = AmenityCategory
        fields = ['id', 'name', 'description', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class AmenityRequestSerializer(serializers.ModelSerializer):
    """Serializer for amenity requests"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    inventory_item_name = serializers.CharField(source='inventory_item.name', read_only=True)
    inventory_item_stock = serializers.IntegerField(source='inventory_item.current_stock', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    completed_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_urgent = serializers.BooleanField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = AmenityRequest
        fields = [
            'id', 'request_number', 'guest', 'guest_name', 'room', 'room_number',
            'category', 'category_name', 'inventory_item', 'inventory_item_name', 'inventory_item_stock',
            'item', 'quantity',
            'status', 'status_display', 'priority', 'priority_display',
            'requested_at', 'delivery_time', 'delivered_at',
            'assigned_to', 'assigned_to_name', 'assigned_to_department',
            'special_instructions', 'notes', 'estimated_cost',
            'guest_rating', 'guest_feedback', 'is_urgent', 'is_overdue',
            'created_at', 'updated_at', 'created_by', 'created_by_name',
            'completed_by', 'completed_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'request_number', 'delivered_at', 'is_urgent', 'is_overdue']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_completed_by_name(self, obj):
        if obj.completed_by:
            return obj.completed_by.get_full_name() or obj.completed_by.username
        return None

class MaintenanceRequestSerializer(serializers.ModelSerializer):
    """Serializer for maintenance requests"""
    room_number = serializers.CharField(source='room.number', read_only=True)
    guest_name = serializers.CharField(source='guest.full_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    resolution_time_hours = serializers.ReadOnlyField()
    efficiency_score = serializers.ReadOnlyField()

    class Meta:
        model = MaintenanceRequest
        fields = [
            'id', 'request_number', 'room', 'room_number', 'guest', 'guest_name',
            'category', 'category_display', 'priority', 'priority_display',
            'status', 'status_display', 'source', 'source_display',
            'title', 'description', 'assigned_technician', 'technician_notes',
            'requested_date', 'acknowledged_date', 'started_date', 'completed_date',
            'estimated_cost', 'actual_cost', 'customer_satisfaction',
            'resolution_time_hours', 'efficiency_score',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'request_number',
            'resolution_time_hours', 'efficiency_score'
        ]


class MaintenanceTechnicianSerializer(serializers.ModelSerializer):
    """Serializer for maintenance technicians"""
    total_requests_completed = serializers.ReadOnlyField()
    average_resolution_time = serializers.ReadOnlyField()
    average_efficiency_score = serializers.ReadOnlyField()
    average_customer_satisfaction = serializers.ReadOnlyField()

    class Meta:
        model = MaintenanceTechnician
        fields = [
            'id', 'name', 'specializations', 'contact_number', 'email', 'is_active',
            'total_requests_completed', 'average_resolution_time',
            'average_efficiency_score', 'average_customer_satisfaction',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class HotelSettingsSerializer(serializers.ModelSerializer):
    """Serializer for hotel settings (singleton)"""

    class Meta:
        model = HotelSettings
        exclude = ["id", "created_at"]
        read_only_fields = ["updated_at"]

