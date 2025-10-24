from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta

from ..models import Reservation
from ..serializers import ReservationSerializer, ReservationListSerializer


class ReservationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing reservations"""
    queryset = Reservation.objects.select_related('guest', 'room', 'room__room_type')
    serializer_class = ReservationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'booking_source', 'guest', 'room']
    search_fields = ['reservation_number', 'guest__first_name', 'guest__last_name']
    ordering_fields = ['check_in_date', 'check_out_date', 'created_at']
    ordering = ['-check_in_date']
    lookup_field = 'reservation_number'

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

    @action(detail=True, methods=['patch'])
    def check_in(self, request, pk=None):
        """Check in a guest"""
        reservation = self.get_object()
        
        if reservation.status != 'CONFIRMED':
            return Response({'error': 'Only confirmed reservations can be checked in'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        reservation.status = 'CHECKED_IN'
        reservation.save(update_fields=['status', 'updated_at'])
        
        # Update room status
        if reservation.room:
            reservation.room.status = 'OCCUPIED'
            reservation.room.save(update_fields=['status', 'updated_at'])
        
        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def check_out(self, request, pk=None):
        """Check out a guest"""
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
        
        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)