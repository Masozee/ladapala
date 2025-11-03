from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import transaction

from ..models import EventPackage, FoodPackage, EventBooking, EventPayment, EventAddOn
from ..serializers import (
    EventPackageSerializer, FoodPackageSerializer,
    EventBookingSerializer, EventPaymentSerializer, EventAddOnSerializer
)


class EventPackageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing event packages (venue packages)"""
    queryset = EventPackage.objects.all()
    serializer_class = EventPackageSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['package_type', 'is_active']
    ordering = ['name']


class FoodPackageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing food packages"""
    queryset = FoodPackage.objects.all()
    serializer_class = FoodPackageSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'is_active']
    ordering = ['name']


class EventBookingViewSet(viewsets.ModelViewSet):
    """ViewSet for managing event bookings"""
    queryset = EventBooking.objects.all().select_related(
        'venue', 'venue__room_type', 'venue_package', 'food_package', 'guest', 'created_by'
    ).prefetch_related('payments', 'addons')
    serializer_class = EventBookingSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'event_type', 'event_date']
    ordering = ['-event_date', '-created_at']

    def perform_create(self, serializer):
        """Set created_by user when creating booking"""
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    def list(self, request, *args, **kwargs):
        """Override list to include statistics"""
        response = super().list(request, *args, **kwargs)

        # Get all bookings for statistics
        all_bookings = EventBooking.objects.all()

        # Calculate statistics
        total_bookings = all_bookings.count()
        pending_bookings = all_bookings.filter(status='PENDING').count()
        confirmed_bookings = all_bookings.filter(status='CONFIRMED').count()
        completed_bookings = all_bookings.filter(status='COMPLETED').count()
        cancelled_bookings = all_bookings.filter(status='CANCELLED').count()

        # Payment statistics
        awaiting_down_payment = all_bookings.filter(down_payment_paid=False).exclude(status='CANCELLED').count()
        awaiting_full_payment = all_bookings.filter(down_payment_paid=True, full_payment_paid=False).exclude(status='CANCELLED').count()
        fully_paid = all_bookings.filter(full_payment_paid=True).count()

        # Add statistics to response
        response.data['statistics'] = {
            'total_bookings': total_bookings,
            'pending_bookings': pending_bookings,
            'confirmed_bookings': confirmed_bookings,
            'completed_bookings': completed_bookings,
            'cancelled_bookings': cancelled_bookings,
            'awaiting_down_payment': awaiting_down_payment,
            'awaiting_full_payment': awaiting_full_payment,
            'fully_paid': fully_paid,
        }

        return response

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a pending event booking"""
        booking = self.get_object()

        if booking.status != 'PENDING':
            return Response(
                {'error': 'Only pending bookings can be confirmed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = 'CONFIRMED'
        booking.save(update_fields=['status', 'updated_at'])

        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an event booking"""
        booking = self.get_object()

        if booking.status == 'COMPLETED':
            return Response(
                {'error': 'Cannot cancel a completed booking'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = 'CANCELLED'
        booking.save(update_fields=['status', 'updated_at'])

        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark event as completed"""
        booking = self.get_object()

        if booking.status != 'CONFIRMED':
            return Response(
                {'error': 'Only confirmed bookings can be completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not booking.full_payment_paid:
            return Response(
                {'error': 'Full payment must be received before completing the event'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = 'COMPLETED'
        booking.save(update_fields=['status', 'updated_at'])

        serializer = self.get_serializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def record_payment(self, request, pk=None):
        """
        Record a payment for event booking
        Payload: {
            "payment_type": "DOWN_PAYMENT" or "FULL_PAYMENT",
            "payment_method": "CASH", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "E_WALLET",
            "amount": 5000000,
            "notes": "Optional notes"
        }
        """
        booking = self.get_object()

        payment_type = request.data.get('payment_type')
        payment_method = request.data.get('payment_method')
        amount = request.data.get('amount')
        notes = request.data.get('notes', '')

        if not payment_type or not payment_method or not amount:
            return Response(
                {'error': 'payment_type, payment_method, and amount are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            amount = float(amount)
            if amount <= 0:
                return Response(
                    {'error': 'Amount must be greater than 0'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid amount value'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate payment type
        if payment_type == 'DOWN_PAYMENT':
            if booking.down_payment_paid:
                return Response(
                    {'error': 'Down payment has already been paid'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if amount < booking.down_payment_amount:
                return Response(
                    {'error': f'Down payment must be at least Rp {booking.down_payment_amount:,.0f}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif payment_type == 'FULL_PAYMENT':
            if not booking.down_payment_paid:
                return Response(
                    {'error': 'Down payment must be paid before full payment'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if booking.full_payment_paid:
                return Response(
                    {'error': 'Full payment has already been received'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if amount < booking.remaining_amount:
                return Response(
                    {'error': f'Full payment must be at least Rp {booking.remaining_amount:,.0f}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {'error': 'Invalid payment_type. Must be DOWN_PAYMENT or FULL_PAYMENT'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # Create payment record
                payment = EventPayment.objects.create(
                    event_booking=booking,
                    payment_type=payment_type,
                    payment_method=payment_method,
                    amount=amount,
                    status='COMPLETED',
                    payment_date=timezone.now(),
                    notes=notes
                )

                # Update booking payment flags
                if payment_type == 'DOWN_PAYMENT':
                    booking.down_payment_paid = True
                elif payment_type == 'FULL_PAYMENT':
                    booking.full_payment_paid = True

                booking.save(update_fields=['down_payment_paid', 'full_payment_paid', 'updated_at'])

                serializer = self.get_serializer(booking)
                return Response(serializer.data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def resend_invoice(self, request, pk=None):
        """Resend invoice email to guest"""
        try:
            booking = self.get_object()

            # Check if booking is fully paid
            if not booking.full_payment_paid:
                return Response(
                    {'error': 'Invoice can only be sent for fully paid bookings'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Send invoice email
            from apps.hotel.services.email_service import send_event_invoice_email
            email_sent = send_event_invoice_email(booking)

            if email_sent:
                return Response({
                    'message': 'Invoice email sent successfully',
                    'sent_to': 'nurojilukmansyah@gmail.com',  # Test email
                    'booking_number': booking.booking_number
                })
            else:
                return Response(
                    {'error': 'Failed to send invoice email. Please check backend logs.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EventPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing event payments (read-only)"""
    queryset = EventPayment.objects.all().select_related('event_booking', 'event_booking__guest')
    serializer_class = EventPaymentSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['event_booking', 'payment_type', 'payment_method', 'status']
    ordering = ['-paid_at', '-created_at']


class EventAddOnViewSet(viewsets.ModelViewSet):
    """ViewSet for managing event add-ons"""
    queryset = EventAddOn.objects.all().select_related('event_booking')
    serializer_class = EventAddOnSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['event_booking', 'addon_type']
    ordering = ['created_at']
