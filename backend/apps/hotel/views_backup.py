from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Prefetch
from django.utils import timezone
from datetime import datetime, timedelta, date

from .models import (
    RoomType, Room, Guest, Reservation, Payment, Complaint, 
    CheckIn, Holiday, InventoryItem
)
from .serializers import (
    RoomTypeSerializer, RoomSerializer, RoomListSerializer,
    GuestSerializer, GuestListSerializer,
    ReservationSerializer, ReservationListSerializer,
    PaymentSerializer, ComplaintSerializer, CheckInSerializer,
    HolidaySerializer, HolidayListSerializer, InventoryItemSerializer
)


class RoomTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing room types"""
    queryset = RoomType.objects.all()
    serializer_class = RoomTypeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'max_occupancy']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'base_price', 'max_occupancy', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active room types"""
        room_types = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(room_types, many=True)
        return Response(serializer.data)


class RoomViewSet(viewsets.ModelViewSet):
    """ViewSet for managing rooms"""
    queryset = Room.objects.select_related('room_type')
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['room_type', 'floor', 'status', 'is_active']
    search_fields = ['number', 'room_type__name']
    ordering_fields = ['number', 'floor', 'created_at']
    ordering = ['number']

    def get_serializer_class(self):
        if self.action == 'list':
            return RoomListSerializer
        return RoomSerializer

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get available rooms for check-in"""
        available_rooms = self.get_queryset().filter(
            status='AVAILABLE',
            is_active=True
        )
        serializer = RoomListSerializer(available_rooms, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_floor(self, request):
        """Get rooms grouped by floor"""
        floor = request.query_params.get('floor')
        if floor:
            try:
                floor = int(floor)
                rooms = self.get_queryset().filter(floor=floor)
                serializer = RoomListSerializer(rooms, many=True)
                return Response({
                    'floor': floor,
                    'rooms': serializer.data
                })
            except ValueError:
                return Response({'error': 'Invalid floor number'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        # Group all rooms by floor
        rooms_by_floor = {}
        for room in self.get_queryset():
            if room.floor not in rooms_by_floor:
                rooms_by_floor[room.floor] = []
            rooms_by_floor[room.floor].append(RoomListSerializer(room).data)
        
        return Response(rooms_by_floor)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update room status"""
        room = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response({'error': 'status field is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Validate status choice
        valid_statuses = [choice[0] for choice in Room.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        room.status = new_status
        room.save(update_fields=['status', 'updated_at'])
        
        serializer = RoomListSerializer(room)
        return Response(serializer.data)


class GuestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing guests"""
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_vip', 'nationality', 'gender']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    ordering_fields = ['first_name', 'last_name', 'created_at']
    ordering = ['first_name', 'last_name']

    def get_serializer_class(self):
        if self.action == 'list':
            return GuestListSerializer
        return GuestSerializer

    @action(detail=False, methods=['get'])
    def vip(self, request):
        """Get VIP guests"""
        vip_guests = self.get_queryset().filter(is_vip=True)
        serializer = GuestListSerializer(vip_guests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search_by_phone(self, request):
        """Search guest by phone number"""
        phone = request.query_params.get('phone')
        if not phone:
            return Response({'error': 'phone parameter is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        guests = self.get_queryset().filter(phone__icontains=phone)
        serializer = GuestListSerializer(guests, many=True)
        return Response(serializer.data)


class ReservationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing reservations"""
    queryset = Reservation.objects.select_related('guest', 'room', 'room__room_type')
    serializer_class = ReservationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'booking_source', 'guest', 'room']
    search_fields = ['reservation_number', 'guest__first_name', 'guest__last_name']
    ordering_fields = ['check_in_date', 'check_out_date', 'created_at']
    ordering = ['-check_in_date']

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
        payments = self.get_queryset().filter(payment_date=today)
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


class ComplaintViewSet(viewsets.ModelViewSet):
    """ViewSet for managing complaints"""
    queryset = Complaint.objects.select_related('guest', 'room')
    serializer_class = ComplaintSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'priority', 'status', 'incident_date']
    search_fields = ['complaint_number', 'title', 'description']
    ordering_fields = ['incident_date', 'priority', 'created_at']
    ordering = ['-incident_date']

    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """Get urgent complaints"""
        urgent_complaints = self.get_queryset().filter(
            priority__in=['HIGH', 'URGENT'],
            status__in=['OPEN', 'IN_PROGRESS']
        )
        serializer = self.get_serializer(urgent_complaints, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unresolved(self, request):
        """Get unresolved complaints"""
        unresolved = self.get_queryset().filter(
            status__in=['OPEN', 'IN_PROGRESS']
        )
        serializer = self.get_serializer(unresolved, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def resolve(self, request, pk=None):
        """Resolve a complaint"""
        complaint = self.get_object()
        resolution = request.data.get('resolution')
        
        if not resolution:
            return Response({'error': 'resolution field is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        complaint.status = 'RESOLVED'
        complaint.resolution = resolution
        complaint.resolved_at = timezone.now()
        complaint.save(update_fields=['status', 'resolution', 'resolved_at', 'updated_at'])
        
        serializer = self.get_serializer(complaint)
        return Response(serializer.data)


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


class HolidayViewSet(viewsets.ModelViewSet):
    """ViewSet for managing holidays"""
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['holiday_type', 'is_work_day', 'date']
    search_fields = ['name', 'name_id', 'description']
    ordering_fields = ['date', 'name', 'created_at']
    ordering = ['date']

    def get_serializer_class(self):
        if self.action == 'list':
            return HolidayListSerializer
        return HolidaySerializer

    @action(detail=False, methods=['get'])
    def current_year(self, request):
        """Get holidays for current year"""
        current_year = timezone.now().year
        holidays = self.get_queryset().filter(date__year=current_year)
        
        serializer = HolidayListSerializer(holidays, many=True)
        return Response({
            'year': current_year,
            'holidays': serializer.data
        })

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming holidays (next 3 months)"""
        today = timezone.now().date()
        three_months = today + timedelta(days=90)
        
        holidays = self.get_queryset().filter(
            date__gte=today,
            date__lte=three_months
        )
        
        serializer = HolidayListSerializer(holidays, many=True)
        return Response({
            'start_date': today,
            'end_date': three_months,
            'holidays': serializer.data
        })

    @action(detail=False, methods=['get'])
    def this_month(self, request):
        """Get holidays for current month"""
        today = timezone.now().date()
        holidays = self.get_queryset().filter(
            date__year=today.year,
            date__month=today.month
        )
        
        serializer = HolidayListSerializer(holidays, many=True)
        return Response({
            'month': today.month,
            'year': today.year,
            'holidays': serializer.data
        })


class InventoryItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing inventory items"""
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'description', 'supplier']
    ordering_fields = ['name', 'current_stock', 'unit_price', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get items with low stock"""
        low_stock_items = [item for item in self.get_queryset() if item.is_low_stock]
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get inventory items grouped by category"""
        items_by_category = {}
        for item in self.get_queryset():
            category = item.get_category_display()
            if category not in items_by_category:
                items_by_category[category] = []
            items_by_category[category].append(InventoryItemSerializer(item).data)
        
        return Response(items_by_category)

    @action(detail=True, methods=['patch'])
    def update_stock(self, request, pk=None):
        """Update item stock"""
        item = self.get_object()
        new_stock = request.data.get('current_stock')
        
        if new_stock is None:
            return Response({'error': 'current_stock field is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_stock = int(new_stock)
            if new_stock < 0:
                return Response({'error': 'Stock cannot be negative'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid stock value'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        item.current_stock = new_stock
        if new_stock > 0:
            item.last_restocked = timezone.now().date()
        item.save(update_fields=['current_stock', 'last_restocked', 'updated_at'])
        
        serializer = self.get_serializer(item)
        return Response(serializer.data)