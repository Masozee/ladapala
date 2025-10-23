from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    RoomType, Room, Guest, Reservation, Payment, Complaint, 
    CheckIn, Holiday, InventoryItem, MaintenanceRequest, MaintenanceTechnician
)


class RoomTypeSerializer(serializers.ModelSerializer):
    """Serializer for room types"""
    class Meta:
        model = RoomType
        fields = [
            'id', 'name', 'description', 'base_price', 'max_occupancy', 
            'size_sqm', 'amenities', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class RoomSerializer(serializers.ModelSerializer):
    """Serializer for rooms"""
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    room_type_details = RoomTypeSerializer(source='room_type', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Room
        fields = [
            'id', 'number', 'room_type', 'room_type_name', 'room_type_details',
            'floor', 'status', 'status_display', 'description', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class GuestSerializer(serializers.ModelSerializer):
    """Serializer for guests"""
    full_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    
    class Meta:
        model = Guest
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'date_of_birth', 'age', 'gender', 'gender_display', 'nationality',
            'passport_number', 'address', 'emergency_contact_name', 
            'emergency_contact_phone', 'dietary_restrictions', 'special_requests',
            'is_vip', 'loyalty_points', 'preferences', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'full_name', 'age']


class ReservationSerializer(serializers.ModelSerializer):
    """Serializer for reservations"""
    guest_name = serializers.CharField(source='guest.full_name', read_only=True)
    guest_details = GuestSerializer(source='guest', read_only=True)
    room_number = serializers.CharField(source='room.number', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    booking_source_display = serializers.CharField(source='get_booking_source_display', read_only=True)
    nights = serializers.IntegerField(read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'reservation_number', 'guest', 'guest_name', 'guest_details',
            'room', 'room_number', 'room_details', 'check_in_date', 'check_out_date',
            'nights', 'adults', 'children', 'total_amount', 'status', 'status_display',
            'booking_source', 'booking_source_display', 'special_requests', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'reservation_number', 'nights', 'total_amount']

    def validate(self, data):
        """Validate reservation data"""
        check_in = data.get('check_in_date')
        check_out = data.get('check_out_date')
        
        if check_in and check_out and check_out <= check_in:
            raise serializers.ValidationError("Check-out date must be after check-in date")
        
        return data


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments"""
    reservation_number = serializers.CharField(source='reservation.reservation_number', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'reservation', 'reservation_number', 'amount', 'payment_method',
            'payment_method_display', 'status', 'status_display', 'payment_date',
            'transaction_id', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ComplaintSerializer(serializers.ModelSerializer):
    """Serializer for complaints"""
    guest_name = serializers.CharField(source='guest.full_name', read_only=True)
    room_number = serializers.CharField(source='room.number', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Complaint
        fields = [
            'id', 'complaint_number', 'title', 'description', 'category',
            'category_display', 'priority', 'priority_display', 'status',
            'status_display', 'guest', 'guest_name', 'room', 'room_number',
            'incident_date', 'resolution', 'resolved_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'complaint_number']


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
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    stock_status = serializers.CharField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = [
            'id', 'name', 'description', 'category', 'category_display',
            'current_stock', 'minimum_stock', 'maximum_stock', 'unit_price',
            'supplier', 'last_restocked', 'stock_status', 'is_low_stock',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'stock_status', 'is_low_stock']


# List serializers for simplified views
class RoomListSerializer(serializers.ModelSerializer):
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Room
        fields = ['id', 'number', 'room_type_name', 'floor', 'status', 'status_display']


class GuestListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Guest
        fields = ['id', 'full_name', 'email', 'phone', 'nationality', 'is_vip']


class ReservationListSerializer(serializers.ModelSerializer):
    guest_name = serializers.CharField(source='guest.full_name', read_only=True)
    room_number = serializers.CharField(source='room.number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    nights = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'reservation_number', 'guest_name', 'room_number',
            'check_in_date', 'check_out_date', 'nights', 'status', 'status_display'
        ]


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
