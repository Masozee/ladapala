"""
API endpoint to provide real-time counts for sidebar badges.
All counts are calculated dynamically from the database.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import date
from apps.hotel.models import (
    Reservation, Complaint, HousekeepingTask, AmenityRequest,
    InventoryItem, PurchaseOrder, MaintenanceRequest, EventBooking,
    Guest, Room
)
from apps.user.models import User


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sidebar_counts(request):
    """
    Get all sidebar badge counts in a single API call.

    Returns counts for:
    - Main Sidebar (Frontline):
      - Pending bookings/reservations
      - Uncompleted complaints (OPEN + IN_PROGRESS)

    - Office Sidebar:
      - Guests (new guests in last 7 days)
      - Employees (pending actions - inactive users)
      - Occupancy (checked in today)
      - Unconfirmed events (PENDING status)
      - Unfinished housekeeping tasks (not CLEAN)
      - Pending financial (unpaid reservations)
      - Low stock items (current_stock <= minimum_stock)
      - Pending reports (not implemented)

    - Support Sidebar:
      - Active maintenance (not COMPLETED/CANCELLED + engineering complaints)
      - Unfinished housekeeping tasks (not CLEAN)
      - Unfinished amenity requests (pending + in_progress)
    """

    # Main Sidebar Counts
    # Only show reservations with check_in_date = today and status = PENDING (not checked in yet)
    today = date.today()
    pending_reservations = Reservation.objects.filter(
        status='PENDING',
        check_in_date=today
    ).count()

    uncompleted_complaints = Complaint.objects.filter(
        Q(status='OPEN') | Q(status='IN_PROGRESS')
    ).count()

    # Office Sidebar Counts
    # New guests in last 7 days
    from datetime import timedelta
    seven_days_ago = timezone.now() - timedelta(days=7)
    new_guests = Guest.objects.filter(created_at__gte=seven_days_ago).count()

    # Inactive employees (for review/action)
    inactive_employees = User.objects.filter(is_active=False).count()

    # Checked in today
    checked_in_today = Reservation.objects.filter(
        status='CHECKED_IN',
        check_in_date=today
    ).count()

    # Unconfirmed events (PENDING status)
    unconfirmed_events = EventBooking.objects.filter(status='PENDING').count()

    office_unfinished_housekeeping = HousekeepingTask.objects.exclude(status='CLEAN').count()

    # Pending financial: unpaid or partially paid reservations
    from django.db.models import F, Sum
    from apps.hotel.models import Payment
    pending_financial = Reservation.objects.filter(
        status__in=['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT']
    ).exclude(
        id__in=Payment.objects.filter(status='COMPLETED').values_list('reservation_id', flat=True)
    ).count()

    # Low stock items: current_stock <= minimum_stock (or <=10 if minimum_stock not set)
    low_stock_items = InventoryItem.objects.filter(
        Q(current_stock__lte=F('minimum_stock')) |
        Q(minimum_stock__isnull=True, current_stock__lte=10)
    ).count()

    # Support Sidebar Counts
    support_unfinished_housekeeping = HousekeepingTask.objects.exclude(status='CLEAN').count()

    unfinished_amenities = AmenityRequest.objects.filter(
        Q(status='PENDING') | Q(status='IN_PROGRESS')
    ).count()

    # Active maintenance: not completed or cancelled
    # Also include complaints assigned to ENGINEERING team
    active_maintenance = MaintenanceRequest.objects.filter(
        ~Q(status='COMPLETED') & ~Q(status='CANCELLED')
    ).count()

    engineering_complaints = Complaint.objects.filter(
        assigned_team='ENGINEERING'
    ).exclude(status__in=['RESOLVED', 'CLOSED']).count()

    total_active_maintenance = active_maintenance + engineering_complaints

    return Response({
        'main_sidebar': {
            'pending_bookings': pending_reservations,
            'uncompleted_complaints': uncompleted_complaints,
        },
        'office_sidebar': {
            'new_guests': new_guests,
            'inactive_employees': inactive_employees,
            'checked_in_today': checked_in_today,
            'unconfirmed_events': unconfirmed_events,
            'unfinished_housekeeping': office_unfinished_housekeeping,
            'pending_financial': pending_financial,
            'low_stock_items': low_stock_items,
        },
        'support_sidebar': {
            'active_maintenance': total_active_maintenance,
            'unfinished_housekeeping': support_unfinished_housekeeping,
            'unfinished_amenities': unfinished_amenities,
        }
    })
