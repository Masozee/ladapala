from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Supplier
from ..serializers import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Supplier model
    Provides CRUD operations for suppliers/vendors
    """
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'contact_person', 'email', 'phone', 'city']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)
