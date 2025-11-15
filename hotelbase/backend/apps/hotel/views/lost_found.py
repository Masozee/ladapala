from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.contrib.auth import get_user_model

from ..models import LostAndFound
from ..serializers.lost_found import (
    LostAndFoundSerializer,
    LostAndFoundCreateSerializer,
    LostAndFoundUpdateStatusSerializer,
    LostAndFoundListSerializer
)

User = get_user_model()


class LostAndFoundViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Lost and Found items"""
    queryset = LostAndFound.objects.select_related(
        'room', 'guest', 'reservation', 'reported_by', 'handler', 'claim_verified_by'
    )
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'report_type', 'category', 'location_type', 'is_valuable', 'reported_date']
    search_fields = ['item_number', 'item_name', 'description', 'room__number', 'guest__first_name', 'guest__last_name']
    ordering_fields = ['reported_date', 'created_at', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return LostAndFoundCreateSerializer
        elif self.action == 'list':
            return LostAndFoundListSerializer
        elif self.action == 'update_status':
            return LostAndFoundUpdateStatusSerializer
        return LostAndFoundSerializer

    def list(self, request, *args, **kwargs):
        """Override list to include statistics"""
        response = super().list(request, *args, **kwargs)

        # Calculate statistics
        all_items = self.get_queryset()

        status_counters = {
            'pending': all_items.filter(status='PENDING').count(),
            'in_storage': all_items.filter(status='IN_STORAGE').count(),
            'claimed': all_items.filter(status='CLAIMED').count(),
            'returned_to_guest': all_items.filter(status='RETURNED_TO_GUEST').count(),
            'disposed': all_items.filter(status='DISPOSED').count(),
            'found_items': all_items.filter(report_type='FOUND').count(),
            'lost_items': all_items.filter(report_type='LOST').count(),
            'valuable_items': all_items.filter(is_valuable=True, status__in=['PENDING', 'IN_STORAGE']).count(),
            'unclaimed_long': sum(1 for item in all_items if item.is_unclaimed_long),
        }

        # Add counters to response
        response.data['status_counters'] = status_counters

        return response

    def perform_create(self, serializer):
        """Set reported_by to current user if authenticated"""
        if self.request.user.is_authenticated:
            serializer.save(reported_by=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending items"""
        pending_items = self.get_queryset().filter(status='PENDING')
        serializer = self.get_serializer(pending_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def in_storage(self, request):
        """Get items in storage"""
        storage_items = self.get_queryset().filter(status='IN_STORAGE')
        serializer = self.get_serializer(storage_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unclaimed(self, request):
        """Get unclaimed items (pending or in storage)"""
        unclaimed_items = self.get_queryset().filter(
            status__in=['PENDING', 'IN_STORAGE']
        )
        serializer = self.get_serializer(unclaimed_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unclaimed_long(self, request):
        """Get items unclaimed for more than 30 days"""
        all_items = self.get_queryset().filter(
            status__in=['PENDING', 'IN_STORAGE']
        )
        long_unclaimed = [item for item in all_items if item.is_unclaimed_long]
        serializer = self.get_serializer(long_unclaimed, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def valuable(self, request):
        """Get valuable items"""
        valuable_items = self.get_queryset().filter(
            is_valuable=True,
            status__in=['PENDING', 'IN_STORAGE']
        )
        serializer = self.get_serializer(valuable_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def found_items(self, request):
        """Get found items"""
        found_items = self.get_queryset().filter(report_type='FOUND')
        serializer = self.get_serializer(found_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def lost_items(self, request):
        """Get lost items reported by guests"""
        lost_items = self.get_queryset().filter(report_type='LOST')
        serializer = self.get_serializer(lost_items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update status of lost and found item"""
        item = self.get_object()
        serializer = LostAndFoundUpdateStatusSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        new_status = validated_data['status']

        # Update item based on status
        if new_status == 'IN_STORAGE':
            item.mark_in_storage(
                storage_location=validated_data.get('storage_location', ''),
                handler=validated_data.get('handler')
            )
        elif new_status == 'CLAIMED':
            item.mark_claimed(
                claimed_by_name=validated_data.get('claimed_by_name', ''),
                claimed_by_contact=validated_data.get('claimed_by_contact', ''),
                verified_by=validated_data.get('claim_verified_by'),
                notes=validated_data.get('claim_notes', '')
            )
        elif new_status == 'RETURNED_TO_GUEST':
            item.mark_returned_to_guest(
                verified_by=validated_data.get('claim_verified_by'),
                notes=validated_data.get('claim_notes', '')
            )
        elif new_status == 'DISPOSED':
            item.mark_disposed(
                disposal_method=validated_data.get('disposal_method', ''),
                notes=validated_data.get('disposal_notes', '')
            )
        else:
            # For other status changes, just update the status
            item.status = new_status
            item.save()

        # Return updated item
        response_serializer = LostAndFoundSerializer(item)
        return Response(response_serializer.data)

    @action(detail=True, methods=['post'])
    def move_to_storage(self, request, pk=None):
        """Move item to storage"""
        item = self.get_object()
        storage_location = request.data.get('storage_location')
        handler_id = request.data.get('handler_id')

        if not storage_location:
            return Response(
                {'error': 'storage_location is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        handler = None
        if handler_id:
            try:
                handler = User.objects.get(id=handler_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'Handler not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        item.mark_in_storage(storage_location, handler)
        serializer = self.get_serializer(item)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_claimed(self, request, pk=None):
        """Mark item as claimed"""
        item = self.get_object()
        claimed_by_name = request.data.get('claimed_by_name')
        claimed_by_contact = request.data.get('claimed_by_contact')
        verified_by_id = request.data.get('verified_by_id')
        notes = request.data.get('notes', '')

        if not claimed_by_name:
            return Response(
                {'error': 'claimed_by_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not verified_by_id:
            return Response(
                {'error': 'verified_by_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            verified_by = User.objects.get(id=verified_by_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Verified by user not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        item.mark_claimed(claimed_by_name, claimed_by_contact, verified_by, notes)
        serializer = self.get_serializer(item)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def return_to_guest(self, request, pk=None):
        """Return item to guest"""
        item = self.get_object()
        verified_by_id = request.data.get('verified_by_id')
        notes = request.data.get('notes', '')

        if not verified_by_id:
            return Response(
                {'error': 'verified_by_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            verified_by = User.objects.get(id=verified_by_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Verified by user not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not item.guest:
            return Response(
                {'error': 'No guest associated with this item'},
                status=status.HTTP_400_BAD_REQUEST
            )

        item.mark_returned_to_guest(verified_by, notes)
        serializer = self.get_serializer(item)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def dispose(self, request, pk=None):
        """Dispose of item"""
        item = self.get_object()
        disposal_method = request.data.get('disposal_method')
        notes = request.data.get('notes', '')

        if not disposal_method:
            return Response(
                {'error': 'disposal_method is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        item.mark_disposed(disposal_method, notes)
        serializer = self.get_serializer(item)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get detailed statistics about lost and found items"""
        all_items = self.get_queryset()

        # Get date range from query params
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if start_date and end_date:
            from datetime import datetime
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                all_items = all_items.filter(reported_date__range=[start, end])
            except ValueError:
                pass

        stats = {
            'total': all_items.count(),
            'by_status': {
                'pending': all_items.filter(status='PENDING').count(),
                'in_storage': all_items.filter(status='IN_STORAGE').count(),
                'claimed': all_items.filter(status='CLAIMED').count(),
                'returned_to_guest': all_items.filter(status='RETURNED_TO_GUEST').count(),
                'disposed': all_items.filter(status='DISPOSED').count(),
            },
            'by_type': {
                'found': all_items.filter(report_type='FOUND').count(),
                'lost': all_items.filter(report_type='LOST').count(),
            },
            'by_category': {},
            'by_location': {},
            'valuable_items': all_items.filter(is_valuable=True).count(),
            'unclaimed_long': sum(1 for item in all_items if item.is_unclaimed_long),
            'claimed_rate': 0,
        }

        # Calculate by category
        for category, _ in LostAndFound.CATEGORY_CHOICES:
            count = all_items.filter(category=category).count()
            if count > 0:
                stats['by_category'][category] = count

        # Calculate by location
        for location, _ in LostAndFound.LOCATION_CHOICES:
            count = all_items.filter(location_type=location).count()
            if count > 0:
                stats['by_location'][location] = count

        # Calculate claimed rate
        found_items = all_items.filter(report_type='FOUND')
        if found_items.count() > 0:
            claimed_items = found_items.filter(status__in=['CLAIMED', 'RETURNED_TO_GUEST']).count()
            stats['claimed_rate'] = round((claimed_items / found_items.count()) * 100, 2)

        return Response(stats)
