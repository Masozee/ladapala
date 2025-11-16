"""
API endpoints for support department reports and analytics.
Provides statistics for maintenance, housekeeping, and amenity services.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q, Avg, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from apps.hotel.models import MaintenanceRequest, HousekeepingTask, AmenityRequest


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def support_analytics(request):
    """
    Get comprehensive support analytics including:
    - Overall statistics
    - Maintenance metrics
    - Housekeeping metrics
    - Amenity request metrics
    - Trends and performance indicators
    """

    now = timezone.now()
    today = now.date()
    last_7_days = today - timedelta(days=7)
    last_30_days = today - timedelta(days=30)

    # === MAINTENANCE STATISTICS ===
    maintenance_total = MaintenanceRequest.objects.count()
    maintenance_active = MaintenanceRequest.objects.filter(
        status__in=['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS']
    ).count()
    maintenance_completed = MaintenanceRequest.objects.filter(status='COMPLETED').count()
    maintenance_cancelled = MaintenanceRequest.objects.filter(status='CANCELLED').count()

    # Maintenance by priority
    maintenance_by_priority = MaintenanceRequest.objects.values('priority').annotate(
        count=Count('id')
    ).order_by('priority')

    # Maintenance by category
    maintenance_by_category = MaintenanceRequest.objects.values('category').annotate(
        count=Count('id')
    ).order_by('-count')[:5]

    # Average resolution time (in hours) for completed requests
    completed_requests = MaintenanceRequest.objects.filter(
        status='COMPLETED',
        completed_date__isnull=False
    )
    avg_resolution_hours = 0
    if completed_requests.exists():
        total_hours = 0
        count = 0
        for req in completed_requests:
            if req.resolution_time_hours:
                total_hours += req.resolution_time_hours
                count += 1
        avg_resolution_hours = round(total_hours / count, 1) if count > 0 else 0

    # Maintenance requests per day (last 7 days)
    maintenance_trend = MaintenanceRequest.objects.filter(
        requested_date__gte=last_7_days
    ).annotate(
        date=TruncDate('requested_date')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')

    # === HOUSEKEEPING STATISTICS ===
    housekeeping_total = HousekeepingTask.objects.count()
    housekeeping_pending = HousekeepingTask.objects.filter(
        status__in=['DIRTY', 'CLEANING', 'INSPECTING']
    ).count()
    housekeeping_completed = HousekeepingTask.objects.filter(status='CLEAN').count()

    # Housekeeping by type
    housekeeping_by_type = HousekeepingTask.objects.values('task_type').annotate(
        count=Count('id')
    ).order_by('-count')

    # Housekeeping by priority
    housekeeping_by_priority = HousekeepingTask.objects.values('priority').annotate(
        count=Count('id')
    ).order_by('priority')

    # Housekeeping tasks per day (last 7 days)
    housekeeping_trend = HousekeepingTask.objects.filter(
        created_at__gte=last_7_days
    ).annotate(
        date=TruncDate('created_at')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')

    # === AMENITY REQUEST STATISTICS ===
    amenity_total = AmenityRequest.objects.count()
    amenity_pending = AmenityRequest.objects.filter(
        status__in=['PENDING', 'IN_PROGRESS']
    ).count()
    amenity_completed = AmenityRequest.objects.filter(status='COMPLETED').count()
    amenity_cancelled = AmenityRequest.objects.filter(status='CANCELLED').count()

    # Amenity requests by category
    amenity_by_category = AmenityRequest.objects.filter(
        category__isnull=False
    ).values('category__name').annotate(
        count=Count('id')
    ).order_by('-count')[:5]

    # Amenity requests by priority
    amenity_by_priority = AmenityRequest.objects.values('priority').annotate(
        count=Count('id')
    ).order_by('priority')

    # Amenity requests per day (last 7 days)
    amenity_trend = AmenityRequest.objects.filter(
        requested_at__gte=last_7_days
    ).annotate(
        date=TruncDate('requested_at')
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')

    # === PERFORMANCE METRICS ===
    # Today's activity
    maintenance_today = MaintenanceRequest.objects.filter(
        requested_date__date=today
    ).count()
    housekeeping_today = HousekeepingTask.objects.filter(
        created_at__date=today
    ).count()
    amenity_today = AmenityRequest.objects.filter(
        requested_at__date=today
    ).count()

    # This week's activity
    maintenance_this_week = MaintenanceRequest.objects.filter(
        requested_date__gte=last_7_days
    ).count()
    housekeeping_this_week = HousekeepingTask.objects.filter(
        created_at__gte=last_7_days
    ).count()
    amenity_this_week = AmenityRequest.objects.filter(
        requested_at__gte=last_7_days
    ).count()

    # This month's activity
    maintenance_this_month = MaintenanceRequest.objects.filter(
        requested_date__gte=last_30_days
    ).count()
    housekeeping_this_month = HousekeepingTask.objects.filter(
        created_at__gte=last_30_days
    ).count()
    amenity_this_month = AmenityRequest.objects.filter(
        requested_at__gte=last_30_days
    ).count()

    return Response({
        'overview': {
            'maintenance': {
                'total': maintenance_total,
                'active': maintenance_active,
                'completed': maintenance_completed,
                'cancelled': maintenance_cancelled,
                'today': maintenance_today,
                'this_week': maintenance_this_week,
                'this_month': maintenance_this_month,
                'avg_resolution_hours': avg_resolution_hours,
            },
            'housekeeping': {
                'total': housekeeping_total,
                'pending': housekeeping_pending,
                'completed': housekeeping_completed,
                'today': housekeeping_today,
                'this_week': housekeeping_this_week,
                'this_month': housekeeping_this_month,
            },
            'amenity': {
                'total': amenity_total,
                'pending': amenity_pending,
                'completed': amenity_completed,
                'cancelled': amenity_cancelled,
                'today': amenity_today,
                'this_week': amenity_this_week,
                'this_month': amenity_this_month,
            }
        },
        'maintenance': {
            'by_priority': list(maintenance_by_priority),
            'by_category': list(maintenance_by_category),
            'trend_7days': list(maintenance_trend),
        },
        'housekeeping': {
            'by_type': list(housekeeping_by_type),
            'by_priority': list(housekeeping_by_priority),
            'trend_7days': list(housekeeping_trend),
        },
        'amenity': {
            'by_category': list(amenity_by_category),
            'by_priority': list(amenity_by_priority),
            'trend_7days': list(amenity_trend),
        }
    })
