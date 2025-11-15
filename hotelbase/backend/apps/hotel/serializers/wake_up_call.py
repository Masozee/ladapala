"""
Wake Up Call Serializers
"""
from rest_framework import serializers
from ..models import WakeUpCall


class WakeUpCallSerializer(serializers.ModelSerializer):
    """Serializer for wake up calls"""
    room_number = serializers.CharField(source='room.number', read_only=True)
    requested_by_name = serializers.SerializerMethodField()
    completed_by_name = serializers.SerializerMethodField()
    is_today = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = WakeUpCall
        fields = [
            'id', 'reservation', 'room', 'room_number', 'guest_name',
            'call_date', 'call_time', 'status', 'notes',
            'requested_by', 'requested_by_name',
            'completed_by', 'completed_by_name', 'completed_at',
            'is_today', 'is_upcoming', 'is_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['completed_by', 'completed_at', 'created_at', 'updated_at']

    def get_requested_by_name(self, obj):
        if obj.requested_by:
            return obj.requested_by.get_full_name()
        return None

    def get_completed_by_name(self, obj):
        if obj.completed_by:
            return obj.completed_by.get_full_name()
        return None


class WakeUpCallCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating wake up calls"""

    class Meta:
        model = WakeUpCall
        fields = [
            'reservation', 'room', 'guest_name', 'call_date', 'call_time', 'notes'
        ]

    def validate(self, data):
        """Validate wake up call data"""
        from django.utils import timezone

        call_date = data.get('call_date')
        call_time = data.get('call_time')

        # Check if date is not in the past
        if call_date < timezone.now().date():
            raise serializers.ValidationError("Cannot schedule wake up call for past dates")

        # If date is today, check if time is not in the past
        if call_date == timezone.now().date():
            now_time = timezone.now().time()
            if call_time < now_time:
                raise serializers.ValidationError("Cannot schedule wake up call for past time")

        return data
