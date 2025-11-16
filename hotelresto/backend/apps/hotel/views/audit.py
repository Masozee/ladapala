from rest_framework import viewsets
from django_filters import rest_framework as filters
from django.db import models

from apps.hotel.models import WarehouseAuditLog
from apps.hotel.serializers.audit import WarehouseAuditLogSerializer


class WarehouseAuditLogFilter(filters.FilterSet):
    """Filter for warehouse audit logs"""
    date_from = filters.DateTimeFilter(field_name='timestamp', lookup_expr='gte')
    date_to = filters.DateTimeFilter(field_name='timestamp', lookup_expr='lte')
    model_name = filters.CharFilter(field_name='model_name', lookup_expr='iexact')
    action_type = filters.ChoiceFilter(choices=WarehouseAuditLog.ACTION_CHOICES)
    user = filters.NumberFilter(field_name='user_id')

    class Meta:
        model = WarehouseAuditLog
        fields = ['date_from', 'date_to', 'model_name', 'action_type', 'user']


class WarehouseAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Warehouse Audit Logs (Read-Only)

    Provides filtering and searching capabilities for audit trail
    """
    queryset = WarehouseAuditLog.objects.all()
    serializer_class = WarehouseAuditLogSerializer
    filterset_class = WarehouseAuditLogFilter

    def get_queryset(self):
        queryset = WarehouseAuditLog.objects.select_related('user').all()

        # Search across object_repr and notes
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(object_repr__icontains=search) |
                models.Q(notes__icontains=search)
            )

        return queryset
