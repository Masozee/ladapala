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
    InventoryItem, PurchaseOrder
)


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
      - Unfinished housekeeping tasks (not CLEAN)
      - Low stock items (current_stock <= minimum_stock)

    - Support Sidebar:
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
    office_unfinished_housekeeping = HousekeepingTask.objects.exclude(status='CLEAN').count()

    # Low stock items: current_stock <= minimum_stock (or <=10 if minimum_stock not set)
    from django.db.models import F
    low_stock_items = InventoryItem.objects.filter(
        Q(current_stock__lte=F('minimum_stock')) |
        Q(minimum_stock__isnull=True, current_stock__lte=10)
    ).count()

    # Support Sidebar Counts
    support_unfinished_housekeeping = HousekeepingTask.objects.exclude(status='CLEAN').count()

    unfinished_amenities = AmenityRequest.objects.filter(
        Q(status='PENDING') | Q(status='IN_PROGRESS')
    ).count()

    return Response({
        'main_sidebar': {
            'pending_bookings': pending_reservations,
            'uncompleted_complaints': uncompleted_complaints,
        },
        'office_sidebar': {
            'unfinished_housekeeping': office_unfinished_housekeeping,
            'low_stock_items': low_stock_items,
        },
        'support_sidebar': {
            'unfinished_housekeeping': support_unfinished_housekeeping,
            'unfinished_amenities': unfinished_amenities,
        }
    })
