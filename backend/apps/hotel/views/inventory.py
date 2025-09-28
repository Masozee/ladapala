from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from ..models import InventoryItem
from ..serializers import InventoryItemSerializer


class InventoryItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing inventory items"""
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'description', 'supplier']
    ordering_fields = ['name', 'current_stock', 'unit_price', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get items with low stock"""
        low_stock_items = [item for item in self.get_queryset() if item.is_low_stock]
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get inventory items grouped by category"""
        items_by_category = {}
        for item in self.get_queryset():
            category = item.get_category_display()
            if category not in items_by_category:
                items_by_category[category] = []
            items_by_category[category].append(InventoryItemSerializer(item).data)
        
        return Response(items_by_category)

    @action(detail=True, methods=['patch'])
    def update_stock(self, request, pk=None):
        """Update item stock"""
        item = self.get_object()
        new_stock = request.data.get('current_stock')
        
        if new_stock is None:
            return Response({'error': 'current_stock field is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_stock = int(new_stock)
            if new_stock < 0:
                return Response({'error': 'Stock cannot be negative'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid stock value'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        item.current_stock = new_stock
        if new_stock > 0:
            item.last_restocked = timezone.now().date()
        item.save(update_fields=['current_stock', 'last_restocked', 'updated_at'])
        
        serializer = self.get_serializer(item)
        return Response(serializer.data)