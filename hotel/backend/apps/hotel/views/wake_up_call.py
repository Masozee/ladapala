"""
Wake Up Call Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q

from ..models import WakeUpCall
from ..serializers.wake_up_call import WakeUpCallSerializer, WakeUpCallCreateSerializer


class WakeUpCallViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing wake up calls
    """
    queryset = WakeUpCall.objects.select_related(
        'room', 'reservation', 'requested_by', 'completed_by'
    ).all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'call_date', 'room']
    search_fields = ['guest_name', 'room__number']
    ordering_fields = ['call_date', 'call_time', 'created_at']
    ordering = ['call_date', 'call_time']

    def get_serializer_class(self):
        if self.action == 'create':
            return WakeUpCallCreateSerializer
        return WakeUpCallSerializer

    def perform_create(self, serializer):
        """Save the user who created the wake up call"""
        serializer.save(requested_by=self.request.user)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get all wake up calls for today"""
        today = timezone.now().date()
        calls = self.queryset.filter(call_date=today).order_by('call_time')
        serializer = self.get_serializer(calls, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending wake up calls"""
        calls = self.queryset.filter(status='PENDING').order_by('call_date', 'call_time')
        serializer = self.get_serializer(calls, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming wake up calls (today and future)"""
        today = timezone.now().date()
        calls = self.queryset.filter(
            call_date__gte=today,
            status='PENDING'
        ).order_by('call_date', 'call_time')
        serializer = self.get_serializer(calls, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue wake up calls"""
        now = timezone.now()
        today = now.date()
        current_time = now.time()

        # Get calls that are in the past and still pending
        calls = self.queryset.filter(
            Q(call_date__lt=today) |
            Q(call_date=today, call_time__lt=current_time),
            status='PENDING'
        ).order_by('call_date', 'call_time')

        serializer = self.get_serializer(calls, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark a wake up call as completed"""
        wake_up_call = self.get_object()

        if wake_up_call.status != 'PENDING':
            return Response(
                {'error': 'Can only complete pending wake up calls'},
                status=status.HTTP_400_BAD_REQUEST
            )

        wake_up_call.mark_completed(request.user)
        serializer = self.get_serializer(wake_up_call)

        return Response({
            'message': 'Wake up call marked as completed',
            'wake_up_call': serializer.data
        })

    @action(detail=True, methods=['post'])
    def mark_missed(self, request, pk=None):
        """Mark a wake up call as missed"""
        wake_up_call = self.get_object()

        if wake_up_call.status != 'PENDING':
            return Response(
                {'error': 'Can only mark pending wake up calls as missed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        wake_up_call.mark_missed()
        serializer = self.get_serializer(wake_up_call)

        return Response({
            'message': 'Wake up call marked as missed',
            'wake_up_call': serializer.data
        })

    @action(detail=True, methods=['post'])
    def mark_cancelled(self, request, pk=None):
        """Cancel a wake up call"""
        wake_up_call = self.get_object()

        if wake_up_call.status not in ['PENDING']:
            return Response(
                {'error': 'Can only cancel pending wake up calls'},
                status=status.HTTP_400_BAD_REQUEST
            )

        wake_up_call.mark_cancelled()
        serializer = self.get_serializer(wake_up_call)

        return Response({
            'message': 'Wake up call cancelled',
            'wake_up_call': serializer.data
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get wake up call statistics"""
        today = timezone.now().date()

        stats = {
            'total': self.queryset.count(),
            'today': self.queryset.filter(call_date=today).count(),
            'pending': self.queryset.filter(status='PENDING').count(),
            'completed_today': self.queryset.filter(
                call_date=today,
                status='COMPLETED'
            ).count(),
            'missed_today': self.queryset.filter(
                call_date=today,
                status='MISSED'
            ).count(),
        }

        return Response(stats)
