from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from ..models import Payment, AdditionalCharge
from ..serializers import PaymentSerializer, AdditionalChargeSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing payments"""
    queryset = Payment.objects.select_related('reservation', 'reservation__guest')
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