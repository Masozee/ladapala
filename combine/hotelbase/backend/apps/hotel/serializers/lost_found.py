from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import LostAndFound, Room, Guest, Reservation

User = get_user_model()


class LostAndFoundSerializer(serializers.ModelSerializer):
    """Serializer for Lost and Found items"""

    # Read-only nested fields
    reported_by_name = serializers.SerializerMethodField()
    handler_name = serializers.SerializerMethodField()
    claim_verified_by_name = serializers.SerializerMethodField()
    guest_name = serializers.SerializerMethodField()
    room_number = serializers.SerializerMethodField()
    reservation_number = serializers.SerializerMethodField()

    # Computed fields
    days_in_storage = serializers.ReadOnlyField()
    is_unclaimed_long = serializers.ReadOnlyField()

    # Display fields
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    location_type_display = serializers.CharField(source='get_location_type_display', read_only=True)

    class Meta:
        model = LostAndFound
        fields = [
            'id', 'item_number', 'report_type', 'report_type_display',
            'item_name', 'description', 'category', 'category_display',
            'status', 'status_display',
            'location_type', 'location_type_display', 'room', 'room_number',
            'specific_location', 'guest', 'guest_name', 'reservation', 'reservation_number',
            'reported_by', 'reported_by_name', 'reported_date', 'reported_time',
            'found_date', 'storage_location', 'handler', 'handler_name',
            'claimed_by_name', 'claimed_by_contact', 'claimed_date', 'claimed_time',
            'claim_verified_by', 'claim_verified_by_name', 'claim_notes',
            'disposal_date', 'disposal_method', 'disposal_notes',
            'estimated_value', 'is_valuable', 'images', 'notes',
            'days_in_storage', 'is_unclaimed_long',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'item_number', 'created_at', 'updated_at', 'reported_time',
            'days_in_storage', 'is_unclaimed_long'
        ]

    def get_reported_by_name(self, obj):
        """Get the name of the staff member who reported the item"""
        if obj.reported_by:
            return f"{obj.reported_by.first_name} {obj.reported_by.last_name}".strip() or obj.reported_by.username
        return None

    def get_handler_name(self, obj):
        """Get the name of the staff member handling the item"""
        if obj.handler:
            return f"{obj.handler.first_name} {obj.handler.last_name}".strip() or obj.handler.username
        return None

    def get_claim_verified_by_name(self, obj):
        """Get the name of the staff member who verified the claim"""
        if obj.claim_verified_by:
            return f"{obj.claim_verified_by.first_name} {obj.claim_verified_by.last_name}".strip() or obj.claim_verified_by.username
        return None

    def get_guest_name(self, obj):
        """Get the full name of the guest"""
        if obj.guest:
            return obj.guest.full_name
        return None

    def get_room_number(self, obj):
        """Get the room number"""
        if obj.room:
            return obj.room.number
        return None

    def get_reservation_number(self, obj):
        """Get the reservation number"""
        if obj.reservation:
            return obj.reservation.reservation_number
        return None


class LostAndFoundCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Lost and Found items"""

    class Meta:
        model = LostAndFound
        fields = [
            'report_type', 'item_name', 'description', 'category',
            'location_type', 'room', 'specific_location',
            'guest', 'reservation', 'reported_by', 'found_date',
            'storage_location', 'handler', 'estimated_value', 'images', 'notes'
        ]

    def validate(self, data):
        """Validate the data"""
        # If location is ROOM, room field should be provided
        if data.get('location_type') == 'ROOM' and not data.get('room'):
            raise serializers.ValidationError({
                'room': 'Room is required when location type is ROOM'
            })

        # If found_date is provided, it should not be in the future
        if data.get('found_date'):
            from django.utils import timezone
            if data['found_date'] > timezone.now().date():
                raise serializers.ValidationError({
                    'found_date': 'Found date cannot be in the future'
                })

        return data


class LostAndFoundUpdateStatusSerializer(serializers.Serializer):
    """Serializer for updating Lost and Found item status"""

    status = serializers.ChoiceField(choices=LostAndFound.STATUS_CHOICES)
    storage_location = serializers.CharField(required=False, allow_blank=True)
    handler = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )
    claimed_by_name = serializers.CharField(required=False, allow_blank=True)
    claimed_by_contact = serializers.CharField(required=False, allow_blank=True)
    claim_verified_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )
    claim_notes = serializers.CharField(required=False, allow_blank=True)
    disposal_method = serializers.CharField(required=False, allow_blank=True)
    disposal_notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        """Validate status update data"""
        status = data.get('status')

        # Validate required fields based on status
        if status == 'IN_STORAGE':
            if not data.get('storage_location'):
                raise serializers.ValidationError({
                    'storage_location': 'Storage location is required when marking item as IN_STORAGE'
                })

        elif status == 'CLAIMED':
            if not data.get('claimed_by_name'):
                raise serializers.ValidationError({
                    'claimed_by_name': 'Claimed by name is required when marking item as CLAIMED'
                })
            if not data.get('claim_verified_by'):
                raise serializers.ValidationError({
                    'claim_verified_by': 'Claim verified by is required when marking item as CLAIMED'
                })

        elif status == 'RETURNED_TO_GUEST':
            if not data.get('claim_verified_by'):
                raise serializers.ValidationError({
                    'claim_verified_by': 'Claim verified by is required when marking item as RETURNED_TO_GUEST'
                })

        elif status == 'DISPOSED':
            if not data.get('disposal_method'):
                raise serializers.ValidationError({
                    'disposal_method': 'Disposal method is required when marking item as DISPOSED'
                })

        return data


class LostAndFoundListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing Lost and Found items"""

    reported_by_name = serializers.SerializerMethodField()
    guest_name = serializers.SerializerMethodField()
    room_number = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    days_in_storage = serializers.ReadOnlyField()
    is_unclaimed_long = serializers.ReadOnlyField()

    class Meta:
        model = LostAndFound
        fields = [
            'id', 'item_number', 'report_type', 'item_name',
            'category', 'category_display', 'status', 'status_display',
            'location_type', 'room_number', 'guest_name', 'reported_by_name',
            'reported_date', 'is_valuable', 'days_in_storage', 'is_unclaimed_long',
            'created_at'
        ]

    def get_reported_by_name(self, obj):
        if obj.reported_by:
            return f"{obj.reported_by.first_name} {obj.reported_by.last_name}".strip() or obj.reported_by.username
        return None

    def get_guest_name(self, obj):
        if obj.guest:
            return obj.guest.full_name
        return None

    def get_room_number(self, obj):
        if obj.room:
            return obj.room.number
        return None
