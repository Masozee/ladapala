from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, DateFilter
from django.utils import timezone
from datetime import timedelta

from ..models import Reservation
from ..serializers import ReservationSerializer, ReservationListSerializer


class LargeResultsSetPagination(PageNumberPagination):
    """Pagination class that allows larger page sizes for calendar view"""
    page_size = 10
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
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = ReservationFilter
    search_fields = ['reservation_number', 'guest__first_name', 'guest__last_name', 'guest__email', 'guest__phone']
    ordering_fields = ['check_in_date', 'check_out_date', 'created_at']
    ordering = ['check_in_date']  # Closest dates first
    lookup_field = 'reservation_number'
    lookup_url_kwarg = 'reservation_number'

    def get_queryset(self):
        """Override to filter from today onwards by default (unless date filters are provided)"""
        queryset = super().get_queryset()

        # Only apply filters for list action (not for detail, check_in, etc.)
        if self.action == 'list':
            # Check for custom date range parameters
            date_from = self.request.query_params.get('date_from')
            date_to = self.request.query_params.get('date_to')

            if date_from and date_to:
                # Show all reservations that overlap with the date range
                # Overlap condition: check_in_date <= date_to AND check_out_date >= date_from
                queryset = queryset.filter(
                    check_in_date__lte=date_to,
                    check_out_date__gte=date_from
                )
            elif date_from:
                # Only start date provided
                queryset = queryset.filter(check_out_date__gte=date_from)
            elif date_to:
                # Only end date provided
                queryset = queryset.filter(check_in_date__lte=date_to)
            else:
                # No date filters - check for legacy filters
                has_date_filters = any([
                    self.request.query_params.get('check_in_date__gte'),
                    self.request.query_params.get('check_in_date__lte'),
                    self.request.query_params.get('check_out_date__gte'),
                    self.request.query_params.get('check_out_date__lte'),
                    self.request.query_params.get('check_in_date'),
                    self.request.query_params.get('check_out_date'),
                ])

                # Only apply default "from today onwards" filter if no date filters at all
                if not has_date_filters:
                    today = timezone.now().date()
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

        # Validate room assignment
        if not reservation.room:
            return Response({
                'error': 'No room assigned to this reservation. Please assign a room before check-in.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate check-in date
        today = timezone.now().date()
        check_in_date = reservation.check_in_date
        is_early_checkin = today < check_in_date

        if today < check_in_date:
            # Early check-in requested - validate room availability
            if reservation.room.status != 'AVAILABLE':
                return Response({
                    'error': f'Early check-in not allowed. Room {reservation.room.number} is currently {reservation.room.get_status_display()}.',
                    'detail': 'Room must be AVAILABLE for early check-in. Please wait until the room is cleaned and ready.',
                    'room_status': reservation.room.status,
                    'room_status_display': reservation.room.get_status_display(),
                    'check_in_date': check_in_date,
                    'today': today
                }, status=status.HTTP_400_BAD_REQUEST)

        # Additional validation: Room must be available or reserved for this reservation
        if reservation.room.status not in ['AVAILABLE', 'RESERVED']:
            return Response({
                'error': f'Room {reservation.room.number} is not ready for check-in. Current status: {reservation.room.get_status_display()}.',
                'detail': 'Room is currently occupied, under maintenance, or out of order.',
                'room_status': reservation.room.status,
                'room_status_display': reservation.room.get_status_display()
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create CheckIn record if not exists
        from ..models import CheckIn
        check_in_record, created = CheckIn.objects.get_or_create(
            reservation=reservation,
            defaults={
                'actual_check_in_time': timezone.now(),
                'early_check_in': is_early_checkin,
                'status': 'CHECKED_IN'
            }
        )

        if not created:
            # Update existing record
            check_in_record.actual_check_in_time = timezone.now()
            check_in_record.early_check_in = is_early_checkin
            check_in_record.status = 'CHECKED_IN'
            check_in_record.save()

        # Update reservation status
        reservation.status = 'CHECKED_IN'
        reservation.save(update_fields=['status', 'updated_at'])

        # Update room status to OCCUPIED
        reservation.room.status = 'OCCUPIED'
        reservation.room.save(update_fields=['status', 'updated_at'])

        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def check_out(self, request, reservation_number=None):
        """Check out a guest and create housekeeping task"""
        from apps.hotel.utils.staff_assignment import create_housekeeping_task_on_checkout
        from apps.hotel.models import CheckIn

        reservation = self.get_object()

        if reservation.status != 'CHECKED_IN':
            return Response({'error': 'Only checked-in reservations can be checked out'},
                          status=status.HTTP_400_BAD_REQUEST)

        # Get or create CheckIn record
        checkin_record = CheckIn.objects.filter(reservation=reservation).first()
        actual_checkout_time = timezone.now()

        # Determine if this is a late checkout
        standard_checkout = timezone.datetime.combine(
            reservation.check_out_date,
            timezone.datetime.min.time().replace(hour=12, minute=0)
        )
        standard_checkout = timezone.make_aware(standard_checkout)
        is_late = actual_checkout_time > standard_checkout

        # Update CheckIn record with actual checkout time
        if checkin_record:
            checkin_record.actual_checkout_time = actual_checkout_time

            # Check if late checkout was approved
            if is_late:
                if not checkin_record.late_checkout_approved:
                    # Late checkout without approval - flag it
                    checkin_record.late_checkout_requested = True
                    delay_hours = int((actual_checkout_time - standard_checkout).total_seconds() / 3600)
                    checkin_record.late_checkout_notes = f'Guest checked out {delay_hours} hour(s) late without prior approval'

            checkin_record.save()

        # Update reservation status
        reservation.status = 'CHECKED_OUT'
        reservation.save(update_fields=['status', 'updated_at'])

        # Update room status
        response_data = {'reservation': ReservationSerializer(reservation).data}

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

                    # Add notification info to response
                    response_data['housekeeping_task'] = {
                        'task_number': housekeeping_task.task_number,
                        'assigned_to': housekeeping_task.assigned_to.get_full_name(),
                        'priority': housekeeping_task.get_priority_display(),
                        'estimated_completion': housekeeping_task.estimated_completion.isoformat() if housekeeping_task.estimated_completion else None
                    }
            else:
                print(f'Warning: Failed to create housekeeping task for room {reservation.room.number}')

        # Add late checkout info to response
        if is_late:
            delay_hours = int((actual_checkout_time - standard_checkout).total_seconds() / 3600)
            response_data['late_checkout'] = {
                'is_late': True,
                'delay_hours': delay_hours,
                'was_approved': checkin_record.late_checkout_approved if checkin_record else False,
                'standard_checkout': standard_checkout.isoformat(),
                'actual_checkout': actual_checkout_time.isoformat()
            }

        return Response(response_data)

    @action(detail=True, methods=['post'])
    def request_late_checkout(self, request, reservation_number=None):
        """Guest requests late checkout"""
        from apps.hotel.models import CheckIn

        reservation = self.get_object()

        if reservation.status != 'CHECKED_IN':
            return Response({
                'error': 'Only checked-in guests can request late checkout'
            }, status=status.HTTP_400_BAD_REQUEST)

        requested_time = request.data.get('requested_checkout_time')
        if not requested_time:
            return Response({
                'error': 'requested_checkout_time is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get or create CheckIn record
        checkin_record, created = CheckIn.objects.get_or_create(
            reservation=reservation,
            defaults={'status': 'CHECKED_IN'}
        )

        # Update late checkout request
        checkin_record.late_checkout_requested = True
        checkin_record.requested_checkout_time = requested_time
        checkin_record.late_checkout_notes = request.data.get('notes', '')
        checkin_record.save()

        return Response({
            'message': 'Late checkout requested successfully',
            'requested_time': requested_time,
            'status': 'PENDING_APPROVAL',
            'reservation_number': reservation.reservation_number
        })

    @action(detail=True, methods=['post'])
    def approve_late_checkout(self, request, reservation_number=None):
        """Front desk approves/denies late checkout request"""
        from apps.hotel.models import CheckIn

        reservation = self.get_object()

        if reservation.status != 'CHECKED_IN':
            return Response({
                'error': 'Only checked-in guests can have late checkout approved'
            }, status=status.HTTP_400_BAD_REQUEST)

        checkin_record = CheckIn.objects.filter(reservation=reservation).first()
        if not checkin_record or not checkin_record.late_checkout_requested:
            return Response({
                'error': 'No late checkout request found for this reservation'
            }, status=status.HTTP_400_BAD_REQUEST)

        approved = request.data.get('approved', False)
        approved_time = request.data.get('approved_checkout_time')
        fee = request.data.get('late_checkout_fee', 0)
        notes = request.data.get('notes', '')

        if approved:
            if not approved_time:
                return Response({
                    'error': 'approved_checkout_time is required when approving'
                }, status=status.HTTP_400_BAD_REQUEST)

            checkin_record.late_checkout_approved = True
            checkin_record.approved_checkout_time = approved_time
            checkin_record.late_checkout_fee = fee
            checkin_record.late_checkout_approved_by = request.user
            checkin_record.late_checkout_notes = notes or checkin_record.late_checkout_notes

            # TODO: Update/reschedule housekeeping task if it exists
            # This will notify the cleaner of the schedule change

            message = f'Late checkout approved until {approved_time}'
        else:
            checkin_record.late_checkout_approved = False
            checkin_record.late_checkout_notes = notes or 'Late checkout request denied'
            message = 'Late checkout request denied'

        checkin_record.save()

        return Response({
            'message': message,
            'approved': approved,
            'approved_time': approved_time if approved else None,
            'fee': fee if approved else None,
            'reservation_number': reservation.reservation_number
        })