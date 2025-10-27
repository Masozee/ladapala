from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, DateFilter
from django.utils import timezone
from datetime import timedelta

from ..models import Reservation
from ..serializers import ReservationSerializer, ReservationListSerializer


class LargeResultsSetPagination(PageNumberPagination):
    """Pagination class that allows larger page sizes for calendar view"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 5000


class ReservationFilter(FilterSet):
    """Custom filter for reservations with date range support"""
    check_in_date = DateFilter(field_name='check_in_date', lookup_expr='exact')
    check_in_date__gte = DateFilter(field_name='check_in_date', lookup_expr='gte')
    check_in_date__lte = DateFilter(field_name='check_in_date', lookup_expr='lte')
    check_out_date = DateFilter(field_name='check_out_date', lookup_expr='exact')
    check_out_date__gte = DateFilter(field_name='check_out_date', lookup_expr='gte')
    check_out_date__lte = DateFilter(field_name='check_out_date', lookup_expr='lte')

    class Meta:
        model = Reservation
        fields = ['status', 'booking_source', 'guest', 'room', 'check_in_date', 'check_out_date']


class ReservationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing reservations"""
    queryset = Reservation.objects.select_related('guest', 'room', 'room__room_type')
    serializer_class = ReservationSerializer
    pagination_class = LargeResultsSetPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = ReservationFilter
    search_fields = ['reservation_number', 'guest__first_name', 'guest__last_name']
    ordering_fields = ['check_in_date', 'check_out_date', 'created_at']
    ordering = ['check_in_date']  # Closest dates first
    lookup_field = 'reservation_number'
    lookup_url_kwarg = 'reservation_number'

    def get_queryset(self):
        """Override to filter from today onwards by default"""
        queryset = super().get_queryset()

        # Only apply date filter for list action (not for detail, check_in, etc.)
        if self.action == 'list':
            today = timezone.now().date()
            # Show reservations from today onwards
            queryset = queryset.filter(check_in_date__gte=today)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ReservationListSerializer
        return ReservationSerializer

    @action(detail=False, methods=['get'])
    def today_arrivals(self, request):
        """Get today's check-in reservations"""
        today = timezone.now().date()
        arrivals = self.get_queryset().filter(
            check_in_date=today,
            status__in=['CONFIRMED', 'CHECKED_IN']
        )
        serializer = ReservationListSerializer(arrivals, many=True)
        return Response({
            'date': today,
            'arrivals': serializer.data
        })

    @action(detail=False, methods=['get'])
    def today_departures(self, request):
        """Get today's check-out reservations"""
        today = timezone.now().date()
        departures = self.get_queryset().filter(
            check_out_date=today,
            status='CHECKED_IN'
        )
        serializer = ReservationListSerializer(departures, many=True)
        return Response({
            'date': today,
            'departures': serializer.data
        })

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming reservations (next 7 days)"""
        today = timezone.now().date()
        next_week = today + timedelta(days=7)
        
        upcoming = self.get_queryset().filter(
            check_in_date__gte=today,
            check_in_date__lte=next_week,
            status='CONFIRMED'
        )
        serializer = ReservationListSerializer(upcoming, many=True)
        return Response({
            'start_date': today,
            'end_date': next_week,
            'reservations': serializer.data
        })

    @action(detail=True, methods=['post'])
    def confirm(self, request, reservation_number=None):
        """Confirm a pending reservation"""
        reservation = self.get_object()

        if reservation.status != 'PENDING':
            return Response({'error': 'Only pending reservations can be confirmed'},
                          status=status.HTTP_400_BAD_REQUEST)

        reservation.status = 'CONFIRMED'
        reservation.save(update_fields=['status', 'updated_at'])

        serializer = ReservationSerializer(reservation)
        return Response({
            'message': 'Reservation confirmed successfully',
            'reservation': serializer.data
        })

    @action(detail=True, methods=['patch'])
    def check_in(self, request, reservation_number=None):
        """Check in a guest"""
        reservation = self.get_object()

        if reservation.status != 'CONFIRMED':
            return Response({'error': 'Only confirmed reservations can be checked in'},
                          status=status.HTTP_400_BAD_REQUEST)

        # Validate check-in date
        today = timezone.now().date()
        check_in_date = reservation.check_in_date

        if today < check_in_date:
            return Response({
                'error': f'Cannot check in before scheduled date. Check-in date is {check_in_date.strftime("%d %b %Y")}. Today is {today.strftime("%d %b %Y")}.',
                'check_in_date': check_in_date,
                'today': today
            }, status=status.HTTP_400_BAD_REQUEST)

        reservation.status = 'CHECKED_IN'
        reservation.save(update_fields=['status', 'updated_at'])

        # Update room status
        if reservation.room:
            reservation.room.status = 'OCCUPIED'
            reservation.room.save(update_fields=['status', 'updated_at'])

        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def check_out(self, request, reservation_number=None):
        """Check out a guest and create housekeeping task"""
        from apps.hotel.utils.staff_assignment import create_housekeeping_task_on_checkout

        reservation = self.get_object()

        if reservation.status != 'CHECKED_IN':
            return Response({'error': 'Only checked-in reservations can be checked out'},
                          status=status.HTTP_400_BAD_REQUEST)

        reservation.status = 'CHECKED_OUT'
        reservation.save(update_fields=['status', 'updated_at'])

        # Update room status
        if reservation.room:
            reservation.room.status = 'MAINTENANCE'  # Room needs cleaning after checkout
            reservation.room.save(update_fields=['status', 'updated_at'])

            # Auto-create housekeeping task with smart staff assignment
            housekeeping_task = create_housekeeping_task_on_checkout(reservation)

            if housekeeping_task:
                # Log successful task creation
                print(f'Housekeeping task {housekeeping_task.task_number} created for room {reservation.room.number}')
                if housekeeping_task.assigned_to:
                    print(f'  Assigned to: {housekeeping_task.assigned_to.full_name}')
            else:
                print(f'Warning: Failed to create housekeeping task for room {reservation.room.number}')

        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)