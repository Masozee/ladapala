"""
Views for promotion management
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Sum, Count
from decimal import Decimal

from ..models import (
    Voucher, Discount, LoyaltyProgram, GuestLoyaltyPoints,
    LoyaltyTransaction, VoucherUsage, Guest, RoomType
)
from ..serializers import (
    VoucherSerializer, VoucherListSerializer, VoucherValidationSerializer,
    DiscountSerializer, LoyaltyProgramSerializer, GuestLoyaltyPointsSerializer,
    LoyaltyTransactionSerializer, PointsRedemptionSerializer, VoucherUsageSerializer
)


class VoucherViewSet(viewsets.ModelViewSet):
    """ViewSet for Voucher management"""

    queryset = Voucher.objects.all().select_related('created_by').prefetch_related('applicable_room_types')
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'voucher_type', 'is_public']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return VoucherListSerializer
        return VoucherSerializer

    def perform_create(self, serializer):
        """Set created_by when creating voucher"""
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(created_by=user)

    def list(self, request, *args, **kwargs):
        """List vouchers with statistics"""
        response = super().list(request, *args, **kwargs)

        # Add statistics
        queryset = self.filter_queryset(self.get_queryset())
        stats = {
            'total_vouchers': queryset.count(),
            'active_vouchers': queryset.filter(status='ACTIVE').count(),
            'expired_vouchers': queryset.filter(status='EXPIRED').count(),
            'used_up_vouchers': queryset.filter(status='USED_UP').count(),
            'total_usage': queryset.aggregate(Sum('usage_count'))['usage_count__sum'] or 0
        }

        response.data['statistics'] = stats
        return response

    @action(detail=False, methods=['post'])
    def validate_code(self, request):
        """Validate a voucher code for a booking"""
        serializer = VoucherValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['code']
        booking_amount = serializer.validated_data['booking_amount']
        guest_id = serializer.validated_data['guest_id']

        try:
            voucher = Voucher.objects.get(code=code)
            guest = Guest.objects.get(id=guest_id)
        except Voucher.DoesNotExist:
            return Response(
                {'error': 'Invalid voucher code'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Guest.DoesNotExist:
            return Response(
                {'error': 'Guest not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate voucher
        if not voucher.is_valid():
            return Response(
                {'error': 'Voucher is not valid or has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if guest can use this voucher
        if not voucher.can_be_used_by_guest(guest):
            return Response(
                {'error': f'You have already used this voucher {voucher.usage_per_guest} time(s)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check minimum booking amount
        if booking_amount < voucher.min_booking_amount:
            return Response(
                {
                    'error': f'Minimum booking amount is Rp {voucher.min_booking_amount:,.0f}',
                    'min_amount': float(voucher.min_booking_amount)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate discount
        discount_amount = voucher.calculate_discount(booking_amount)

        return Response({
            'valid': True,
            'voucher': VoucherSerializer(voucher).data,
            'discount_amount': float(discount_amount),
            'final_amount': float(booking_amount - discount_amount)
        })

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a voucher"""
        voucher = self.get_object()
        voucher.status = 'ACTIVE'
        voucher.save()
        return Response({'message': 'Voucher activated successfully'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a voucher"""
        voucher = self.get_object()
        voucher.status = 'INACTIVE'
        voucher.save()
        return Response({'message': 'Voucher deactivated successfully'})

    @action(detail=True, methods=['get'])
    def usage_history(self, request, pk=None):
        """Get voucher usage history"""
        voucher = self.get_object()
        usages = voucher.usages.all().select_related('guest', 'reservation', 'payment')
        serializer = VoucherUsageSerializer(usages, many=True)
        return Response(serializer.data)


class DiscountViewSet(viewsets.ModelViewSet):
    """ViewSet for Discount management"""

    queryset = Discount.objects.all().prefetch_related('applicable_room_types')
    serializer_class = DiscountSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['discount_type', 'is_active']
    ordering = ['-priority', '-created_at']

    def list(self, request, *args, **kwargs):
        """List discounts with statistics"""
        response = super().list(request, *args, **kwargs)

        # Add statistics
        queryset = self.filter_queryset(self.get_queryset())
        stats = {
            'total_discounts': queryset.count(),
            'active_discounts': queryset.filter(is_active=True).count(),
            'inactive_discounts': queryset.filter(is_active=False).count(),
        }

        # Count by type
        by_type = queryset.values('discount_type').annotate(count=Count('id'))
        stats['by_type'] = {item['discount_type']: item['count'] for item in by_type}

        response.data['statistics'] = stats
        return response

    @action(detail=False, methods=['post'])
    def check_applicable(self, request):
        """Check applicable discounts for booking"""
        check_in = request.data.get('check_in_date')
        check_out = request.data.get('check_out_date')
        room_type_id = request.data.get('room_type_id')

        from datetime import datetime
        check_in_date = datetime.fromisoformat(check_in).date()
        check_out_date = datetime.fromisoformat(check_out).date()

        room_type = None
        if room_type_id:
            try:
                room_type = RoomType.objects.get(id=room_type_id)
            except RoomType.DoesNotExist:
                pass

        # Find applicable discounts
        applicable_discounts = []
        for discount in Discount.objects.filter(is_active=True):
            if discount.is_applicable(check_in_date, check_out_date, room_type):
                applicable_discounts.append(discount)

        serializer = DiscountSerializer(applicable_discounts, many=True)
        return Response(serializer.data)


class LoyaltyProgramViewSet(viewsets.ModelViewSet):
    """ViewSet for Loyalty Program management"""

    queryset = LoyaltyProgram.objects.all()
    serializer_class = LoyaltyProgramSerializer
    permission_classes = [AllowAny]
    ordering = ['-created_at']

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active loyalty program"""
        program = LoyaltyProgram.objects.filter(is_active=True).first()
        if not program:
            return Response(
                {'error': 'No active loyalty program found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(program)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get loyalty program statistics"""
        program = self.get_object()

        stats = {
            'total_members': GuestLoyaltyPoints.objects.count(),
            'total_points_issued': GuestLoyaltyPoints.objects.aggregate(
                Sum('lifetime_points')
            )['lifetime_points__sum'] or 0,
            'total_points_balance': GuestLoyaltyPoints.objects.aggregate(
                Sum('total_points')
            )['total_points__sum'] or 0,
            'total_points_redeemed': LoyaltyTransaction.objects.filter(
                transaction_type='REDEEM'
            ).aggregate(Sum('points'))['points__sum'] or 0,
        }

        return Response(stats)


class GuestLoyaltyPointsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Guest Loyalty Points (read-only)"""

    queryset = GuestLoyaltyPoints.objects.all().select_related('guest')
    serializer_class = GuestLoyaltyPointsSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['guest']
    ordering = ['-total_points']

    @action(detail=False, methods=['post'])
    def redeem(self, request):
        """Redeem points for a guest"""
        serializer = PointsRedemptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        guest_id = serializer.validated_data['guest_id']
        points = serializer.validated_data['points']
        description = serializer.validated_data.get('description', 'Points redemption')

        try:
            guest = Guest.objects.get(id=guest_id)
            loyalty_points = GuestLoyaltyPoints.objects.get(guest=guest)
        except Guest.DoesNotExist:
            return Response(
                {'error': 'Guest not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except GuestLoyaltyPoints.DoesNotExist:
            return Response(
                {'error': 'Guest has no loyalty account'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if guest has enough points
        if points > loyalty_points.total_points:
            return Response(
                {'error': f'Insufficient points. Available: {loyalty_points.total_points}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check minimum redemption
        program = LoyaltyProgram.objects.filter(is_active=True).first()
        if program and points < program.min_points_to_redeem:
            return Response(
                {'error': f'Minimum redemption is {program.min_points_to_redeem} points'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate rupiah value
        if program:
            rupiah_value = Decimal(str(points)) * program.rupiah_per_point
        else:
            rupiah_value = Decimal(str(points * 100))  # Default: 1 point = Rp 100

        # Redeem points
        try:
            loyalty_points.redeem_points(points, description)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'success': True,
            'points_redeemed': points,
            'rupiah_value': float(rupiah_value),
            'remaining_points': loyalty_points.total_points
        })

    @action(detail=False, methods=['get'])
    def by_guest(self, request):
        """Get loyalty points for a specific guest"""
        guest_id = request.query_params.get('guest_id')
        if not guest_id:
            return Response(
                {'error': 'guest_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            loyalty_points = GuestLoyaltyPoints.objects.get(guest_id=guest_id)
        except GuestLoyaltyPoints.DoesNotExist:
            return Response(
                {'error': 'Guest has no loyalty account'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(loyalty_points)
        return Response(serializer.data)


class LoyaltyTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Loyalty Transaction history (read-only)"""

    queryset = LoyaltyTransaction.objects.all().select_related('guest')
    serializer_class = LoyaltyTransactionSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['guest', 'transaction_type']
    ordering = ['-created_at']
