from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from ..models import AmenityRequest, AmenityCategory, InventoryItem
from ..serializers import AmenityRequestSerializer, AmenityCategorySerializer, InventoryItemSerializer


class AmenityCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing amenity categories"""
    queryset = AmenityCategory.objects.filter(is_active=True)
    serializer_class = AmenityCategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['name', 'is_active']
    search_fields = ['display_name', 'description']
    ordering_fields = ['display_name', 'created_at']
    ordering = ['display_name']


class AmenityRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing amenity requests"""
    queryset = AmenityRequest.objects.all().select_related(
        'category', 'guest', 'room', 'assigned_to', 'created_by', 'completed_by', 'inventory_item'
    )
    serializer_class = AmenityRequestSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'category', 'room', 'guest']
    search_fields = ['request_number', 'guest_name', 'room_number', 'item']
    ordering_fields = ['requested_at', 'priority', 'status']
    ordering = ['-requested_at']

    def perform_create(self, serializer):
        """Set created_by when creating new request"""
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def mark_in_progress(self, request, pk=None):
        """Mark request as in progress"""
        amenity_request = self.get_object()

        if amenity_request.status != 'PENDING':
            return Response(
                {'error': 'Can only mark pending requests as in progress'},
                status=status.HTTP_400_BAD_REQUEST
            )

        amenity_request.mark_in_progress(user=request.user if request.user.is_authenticated else None)

        serializer = self.get_serializer(amenity_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark request as completed and auto-deduct stock"""
        amenity_request = self.get_object()

        if amenity_request.status not in ['PENDING', 'IN_PROGRESS']:
            return Response(
                {'error': 'Can only mark pending or in-progress requests as completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check stock availability if linked to inventory
        if amenity_request.inventory_item:
            if amenity_request.inventory_item.current_stock < amenity_request.quantity:
                return Response(
                    {
                        'error': f'Insufficient stock. Available: {amenity_request.inventory_item.current_stock}, Required: {amenity_request.quantity}',
                        'available_stock': amenity_request.inventory_item.current_stock,
                        'required_quantity': amenity_request.quantity
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        amenity_request.mark_completed(user=request.user if request.user.is_authenticated else None)

        serializer = self.get_serializer(amenity_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel request"""
        amenity_request = self.get_object()

        if amenity_request.status in ['COMPLETED', 'CANCELLED']:
            return Response(
                {'error': 'Cannot cancel completed or already cancelled requests'},
                status=status.HTTP_400_BAD_REQUEST
            )

        amenity_request.mark_cancelled()

        serializer = self.get_serializer(amenity_request)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get amenity request statistics"""
        pending_count = AmenityRequest.objects.filter(status='PENDING').count()
        in_progress_count = AmenityRequest.objects.filter(status='IN_PROGRESS').count()
        completed_count = AmenityRequest.objects.filter(status='COMPLETED').count()
        urgent_count = AmenityRequest.objects.filter(priority='URGENT', status__in=['PENDING', 'IN_PROGRESS']).count()

        return Response({
            'pending': pending_count,
            'in_progress': in_progress_count,
            'completed': completed_count,
            'urgent': urgent_count,
            'total': AmenityRequest.objects.count(),
        })

    @action(detail=False, methods=['get'])
    def inventory_items(self, request):
        """Get inventory items categorized as AMENITIES"""
        amenities = InventoryItem.objects.filter(
            category='AMENITIES',
            is_active=True
        ).order_by('name')

        serializer = InventoryItemSerializer(amenities, many=True)
        return Response(serializer.data)
