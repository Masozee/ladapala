from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from ..models import Payment
from ..serializers import PaymentSerializer


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