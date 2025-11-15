from rest_framework import serializers
from apps.hotel.models import WarehouseAuditLog


class WarehouseAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for warehouse audit logs"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True, allow_null=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    changes_display = serializers.SerializerMethodField()

    class Meta:
        model = WarehouseAuditLog
        fields = [
            'id', 'action_type', 'action_type_display', 'model_name', 'object_id', 'object_repr',
            'changes', 'changes_display', 'user', 'user_name', 'ip_address', 'user_agent',
            'notes', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']

    def get_changes_display(self, obj):
        """Return formatted changes for display"""
        return obj.get_changes_display()
