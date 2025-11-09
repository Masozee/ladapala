from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from ..models import CheckIn
from ..serializers import CheckInSerializer


class CheckInViewSet(viewsets.ModelViewSet):
    """ViewSet for managing check-ins"""
    queryset = CheckIn.objects.select_related('reservation', 'reservation__guest', 'reservation__room')
    serializer_class = CheckInSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'early_check_in', 'late_check_in', 'room_key_issued']
    search_fields = ['reservation__reservation_number', 'reservation__guest__first_name']
    ordering_fields = ['actual_check_in_time', 'created_at']
    ordering = ['-actual_check_in_time']

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's check-ins"""
        today = timezone.now().date()
        checkins = self.get_queryset().filter(
            actual_check_in_time__date=today
        )
        serializer = self.get_serializer(checkins, many=True)
        return Response({
            'date': today,
            'checkins': serializer.data
        })

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending check-ins"""
        pending = self.get_queryset().filter(status='PENDING')
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)