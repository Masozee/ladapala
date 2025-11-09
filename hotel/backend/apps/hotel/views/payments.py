from rest_framework import viewsets, status as http_status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from decimal import Decimal

from ..models import Payment, AdditionalCharge, Reservation
from ..serializers import PaymentSerializer, AdditionalChargeSerializer
from ..services.payment_calculator import PaymentCalculator, PaymentCalculationError


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing payments"""
    queryset = Payment.objects.select_related('reservation', 'reservation__guest', 'voucher', 'discount')
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['payment_method', 'status', 'payment_date']
    search_fields = ['reservation__reservation_number', 'transaction_id']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date']

    @action(detail=False, methods=['get'])
    def today_payments(self, request):
        """Get today's payments"""
        today = timezone.now().date()
        payments = self.get_queryset().filter(payment_date__date=today)
        serializer = self.get_serializer(payments, many=True)
        
        total_amount = sum(payment.amount for payment in payments if payment.status == 'COMPLETED')
        
        return Response({
            'date': today,
            'payments': serializer.data,
            'total_amount': total_amount
        })

    @action(detail=False, methods=['get'])
    def by_method(self, request):
        """Get payments grouped by payment method"""
        payments_by_method = {}
        for payment in self.get_queryset():
            method = payment.get_payment_method_display()
            if method not in payments_by_method:
                payments_by_method[method] = []
            payments_by_method[method].append(PaymentSerializer(payment).data)

        return Response(payments_by_method)

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """
        Calculate payment amount with promotions applied
        POST data:
        - reservation_id: ID of the reservation
        - voucher_code: (optional) Voucher code to apply
        - redeem_points: (optional) Number of loyalty points to redeem
        """
        reservation_id = request.data.get('reservation_id')
        voucher_code = request.data.get('voucher_code')
        redeem_points = int(request.data.get('redeem_points', 0))

        if not reservation_id:
            return Response(
                {'error': 'reservation_id is required'},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        try:
            reservation = Reservation.objects.select_related('guest', 'room').get(id=reservation_id)
        except Reservation.DoesNotExist:
            return Response(
                {'error': 'Reservation not found'},
                status=http_status.HTTP_404_NOT_FOUND
            )

        # Calculate payment
        calculator = PaymentCalculator(reservation)
        result = calculator.calculate(
            voucher_code=voucher_code,
            redeem_points=redeem_points
        )

        if not result['success']:
            return Response(
                {'error': result['error'], 'error_type': result.get('error_type')},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        return Response(result)

    @action(detail=False, methods=['post'])
    def process_with_promotions(self, request):
        """
        Process payment with promotions
        POST data:
        - reservation_id: ID of the reservation
        - payment_method: Payment method
        - payment_type: (optional) Payment type (FULL, DEPOSIT, BALANCE)
        - transaction_id: (optional) Transaction ID
        - voucher_code: (optional) Voucher code to apply
        - redeem_points: (optional) Number of loyalty points to redeem
        - pdf_content: (optional) Base64 encoded PDF invoice to send via email
        """
        reservation_id = request.data.get('reservation_id')
        payment_method = request.data.get('payment_method')
        payment_type = request.data.get('payment_type', 'FULL')
        transaction_id = request.data.get('transaction_id')
        voucher_code = request.data.get('voucher_code')
        redeem_points = int(request.data.get('redeem_points', 0))
        pdf_content = request.data.get('pdf_content')

        if not reservation_id or not payment_method:
            return Response(
                {'error': 'reservation_id and payment_method are required'},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        try:
            reservation = Reservation.objects.select_related('guest', 'room').get(id=reservation_id)
        except Reservation.DoesNotExist:
            return Response(
                {'error': 'Reservation not found'},
                status=http_status.HTTP_404_NOT_FOUND
            )

        # Process payment with calculator
        calculator = PaymentCalculator(reservation)

        try:
            payment, calculation = calculator.create_payment(
                payment_method=payment_method,
                transaction_id=transaction_id,
                voucher_code=voucher_code,
                redeem_points=redeem_points,
                payment_type=payment_type
            )
        except PaymentCalculationError as e:
            return Response(
                {'error': str(e)},
                status=http_status.HTTP_400_BAD_REQUEST
            )

        # If payment successful and PDF provided, send invoice email (Phase 2 - only when fully paid)
        email_sent = False
        if payment.status == 'COMPLETED' and pdf_content:
            # Check if reservation is now fully paid
            reservation.refresh_from_db()  # Refresh to get updated payment status
            is_fully_paid = reservation.is_fully_paid() if hasattr(reservation, 'is_fully_paid') else False

            # Only send invoice email if reservation is FULLY PAID
            if is_fully_paid:
                try:
                    from apps.hotel.services.email_service_simple import send_reservation_invoice_email_with_pdf
                    email_sent = send_reservation_invoice_email_with_pdf(reservation, pdf_content)
                    print(f"✅ Phase 2 Email: Invoice sent to {reservation.guest.email} - Fully Paid")
                except Exception as e:
                    # Log error but don't fail the payment
                    print(f"Error sending invoice email: {str(e)}")
            else:
                print(f"ℹ️ Payment recorded but not fully paid yet. Invoice will be sent after full payment.")

        # Return payment data with calculation details
        serializer = self.get_serializer(payment)
        return Response({
            'payment': serializer.data,
            'calculation': calculation,
            'invoice_sent': email_sent
        }, status=http_status.HTTP_201_CREATED)


class AdditionalChargeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing additional charges"""
    queryset = AdditionalCharge.objects.select_related('reservation', 'reservation__guest', 'charged_by')
    serializer_class = AdditionalChargeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['reservation', 'charge_type', 'is_paid']
    search_fields = ['reservation__reservation_number', 'description']
    ordering_fields = ['charged_at', 'amount', 'created_at']
    ordering = ['-charged_at']

    @action(detail=False, methods=['get'])
    def unpaid(self, request):
        """Get all unpaid charges"""
        unpaid_charges = self.get_queryset().filter(is_paid=False)
        serializer = self.get_serializer(unpaid_charges, many=True)

        total_unpaid = sum(charge.total_amount for charge in unpaid_charges)

        return Response({
            'charges': serializer.data,
            'total_unpaid': total_unpaid,
            'count': unpaid_charges.count()
        })

    @action(detail=False, methods=['get'], url_path='by-reservation/(?P<reservation_id>[^/.]+)')
    def by_reservation(self, request, reservation_id=None):
        """Get all charges for a specific reservation"""
        charges = self.get_queryset().filter(reservation_id=reservation_id)
        serializer = self.get_serializer(charges, many=True)

        total_charges = sum(charge.total_amount for charge in charges)
        unpaid_charges = sum(charge.total_amount for charge in charges if not charge.is_paid)

        return Response({
            'charges': serializer.data,
            'total_charges': total_charges,
            'unpaid_charges': unpaid_charges,
            'count': charges.count()
        })