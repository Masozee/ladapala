"""
Serializers for promotion models
"""
from rest_framework import serializers
from ..models import (
    Voucher, Discount, LoyaltyProgram, GuestLoyaltyPoints,
    LoyaltyTransaction, VoucherUsage, RoomType
)


class RoomTypeSimpleSerializer(serializers.ModelSerializer):
    """Simple room type serializer for nested use"""
    class Meta:
        model = RoomType
        fields = ['id', 'name']


class VoucherSerializer(serializers.ModelSerializer):
    """Serializer for Voucher model"""

    applicable_room_types = RoomTypeSimpleSerializer(many=True, read_only=True)
    applicable_room_type_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=RoomType.objects.all(),
        source='applicable_room_types', write_only=True, required=False
    )

    usage_remaining = serializers.SerializerMethodField()
    is_currently_valid = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'name', 'description', 'voucher_type',
            'discount_percentage', 'discount_amount', 'max_discount_amount',
            'usage_limit', 'usage_count', 'usage_remaining', 'usage_per_guest',
            'valid_from', 'valid_until', 'min_booking_amount', 'min_nights',
            'applicable_room_types', 'applicable_room_type_ids',
            'status', 'is_public', 'terms_and_conditions', 'is_currently_valid',
            'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['usage_count', 'created_at', 'updated_at', 'created_by']

    def get_usage_remaining(self, obj):
        if obj.usage_limit:
            return max(0, obj.usage_limit - obj.usage_count)
        return None

    def get_is_currently_valid(self, obj):
        return obj.is_valid()


class VoucherListSerializer(serializers.ModelSerializer):
    """Simplified serializer for voucher list"""

    usage_remaining = serializers.SerializerMethodField()
    discount_display = serializers.SerializerMethodField()

    class Meta:
        model = Voucher
        fields = [
            'id', 'code', 'name', 'voucher_type', 'discount_display',
            'usage_count', 'usage_limit', 'usage_remaining',
            'valid_from', 'valid_until', 'status', 'is_public'
        ]

    def get_usage_remaining(self, obj):
        if obj.usage_limit:
            return max(0, obj.usage_limit - obj.usage_count)
        return 'Unlimited'

    def get_discount_display(self, obj):
        if obj.voucher_type == 'PERCENTAGE':
            return f"{obj.discount_percentage}%"
        elif obj.voucher_type == 'FIXED_AMOUNT':
            return f"Rp {obj.discount_amount:,.0f}"
        return obj.get_voucher_type_display()


class VoucherValidationSerializer(serializers.Serializer):
    """Serializer for voucher validation request"""

    code = serializers.CharField(max_length=50)
    booking_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    guest_id = serializers.IntegerField()
    check_in_date = serializers.DateField(required=False)
    check_out_date = serializers.DateField(required=False)
    room_type_id = serializers.IntegerField(required=False)


class DiscountSerializer(serializers.ModelSerializer):
    """Serializer for Discount model"""

    applicable_room_types = RoomTypeSimpleSerializer(many=True, read_only=True)
    applicable_room_type_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=RoomType.objects.all(),
        source='applicable_room_types', write_only=True, required=False
    )

    discount_type_display = serializers.CharField(source='get_discount_type_display', read_only=True)

    class Meta:
        model = Discount
        fields = [
            'id', 'name', 'description', 'discount_type', 'discount_type_display',
            'discount_percentage', 'min_nights', 'min_advance_days', 'max_advance_days',
            'valid_from', 'valid_until', 'applicable_from', 'applicable_until',
            'applicable_room_types', 'applicable_room_type_ids',
            'is_active', 'priority', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class LoyaltyProgramSerializer(serializers.ModelSerializer):
    """Serializer for Loyalty Program"""

    class Meta:
        model = LoyaltyProgram
        fields = [
            'id', 'name', 'description', 'points_per_rupiah', 'rupiah_per_point',
            'min_points_to_redeem', 'points_expiry_months', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    """Serializer for Loyalty Transaction"""

    guest_name = serializers.CharField(source='guest.name', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)

    class Meta:
        model = LoyaltyTransaction
        fields = [
            'id', 'guest', 'guest_name', 'transaction_type', 'transaction_type_display',
            'points', 'balance_after', 'description', 'reference_type', 'reference_id',
            'created_at', 'expires_at'
        ]
        read_only_fields = ['created_at']


class GuestLoyaltyPointsSerializer(serializers.ModelSerializer):
    """Serializer for Guest Loyalty Points"""

    guest_name = serializers.CharField(source='guest.name', read_only=True)
    guest_email = serializers.EmailField(source='guest.email', read_only=True)
    recent_transactions = serializers.SerializerMethodField()

    class Meta:
        model = GuestLoyaltyPoints
        fields = [
            'id', 'guest', 'guest_name', 'guest_email',
            'total_points', 'lifetime_points', 'recent_transactions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['total_points', 'lifetime_points', 'created_at', 'updated_at']

    def get_recent_transactions(self, obj):
        transactions = obj.guest.loyalty_transactions.all()[:5]
        return LoyaltyTransactionSerializer(transactions, many=True).data


class PointsRedemptionSerializer(serializers.Serializer):
    """Serializer for points redemption request"""

    guest_id = serializers.IntegerField()
    points = serializers.IntegerField(min_value=1)
    description = serializers.CharField(max_length=500, required=False)


class VoucherUsageSerializer(serializers.ModelSerializer):
    """Serializer for Voucher Usage tracking"""

    voucher_code = serializers.CharField(source='voucher.code', read_only=True)
    voucher_name = serializers.CharField(source='voucher.name', read_only=True)
    guest_name = serializers.CharField(source='guest.name', read_only=True)
    reservation_number = serializers.CharField(source='reservation.reservation_number', read_only=True)

    class Meta:
        model = VoucherUsage
        fields = [
            'id', 'voucher', 'voucher_code', 'voucher_name',
            'guest', 'guest_name', 'reservation', 'reservation_number',
            'payment', 'discount_amount', 'used_at'
        ]
        read_only_fields = ['used_at']
