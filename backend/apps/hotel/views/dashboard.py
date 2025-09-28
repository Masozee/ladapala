from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q, Avg
from datetime import date, timedelta
from ..models import (
    Room, Reservation, Guest, CheckIn, CalendarEvent, Holiday
)


@api_view(['GET'])
@permission_classes([AllowAny])
def hotel_dashboard(request):
    """
    Hotel main dashboard API endpoint
    Provides comprehensive data for hotel homepage dashboard
    """
    today = date.today()
    now = timezone.now()
    
    # Basic metrics - count all active rooms (available for booking)
    total_rooms = Room.objects.filter(is_active=True).count()
    
    # Today's active guests (distinct count of rooms currently occupied today)
    # Count unique rooms that have active reservations
    todays_active_guests = Reservation.objects.filter(
        check_in_date__lte=today,
        check_out_date__gt=today,
        status='CHECKED_IN'
    ).values('room').distinct().count()
    
    # Calculate realistic occupancy rate based on occupied rooms, not guest count
    occupancy_rate = (todays_active_guests / total_rooms * 100) if total_rooms > 0 else 0
    
    # Today's check-ins (guests who checked in today)
    todays_checkins = CheckIn.objects.filter(
        actual_check_in_time__date=today
    ).count()
    
    # Active guests (currently in hotel today)
    active_guests = todays_active_guests
    
    # Visitor demographics for pie chart
    # Get guests from recent reservations (last 30 days)
    recent_date = today - timedelta(days=30)
    visitor_demographics = Guest.objects.filter(
        reservation__check_in_date__gte=recent_date
    ).values('nationality').annotate(
        count=Count('id')
    ).order_by('-count')[:8]  # Top 8 nationalities
    
    # Convert to pie chart format
    demographics_data = []
    total_visitors = sum(item['count'] for item in visitor_demographics)
    
    for item in visitor_demographics:
        percentage = (item['count'] / total_visitors * 100) if total_visitors > 0 else 0
        demographics_data.append({
            'nationality': item['nationality'],
            'count': item['count'],
            'percentage': round(percentage, 1)
        })
    
    # Daily occupation comparison for current week vs same week previous month
    # Get current week (Monday to Sunday)
    days_since_monday = today.weekday()
    week_start = today - timedelta(days=days_since_monday)
    week_end = week_start + timedelta(days=6)
    
    # Get same week from previous month
    prev_month_start = week_start - timedelta(days=30)
    prev_month_end = week_end - timedelta(days=30)
    
    # Calculate daily occupancy for current week
    current_week_data = []
    prev_week_data = []
    
    for i in range(7):
        # Current week
        current_day = week_start + timedelta(days=i)
        current_occupied = Reservation.objects.filter(
            check_in_date__lte=current_day,
            check_out_date__gt=current_day,
            status__in=['CHECKED_IN', 'CHECKED_OUT']
        ).values('room').distinct().count()
        current_occupancy = (current_occupied / total_rooms * 100) if total_rooms > 0 else 0
        
        # Previous month same week
        prev_day = prev_month_start + timedelta(days=i)
        prev_occupied = Reservation.objects.filter(
            check_in_date__lte=prev_day,
            check_out_date__gt=prev_day,
            status__in=['CHECKED_IN', 'CHECKED_OUT']
        ).values('room').distinct().count()
        prev_occupancy = (prev_occupied / total_rooms * 100) if total_rooms > 0 else 0
        
        current_week_data.append({
            'day': current_day.strftime('%A'),
            'date': current_day.strftime('%Y-%m-%d'),
            'occupancy': round(current_occupancy, 1),
            'occupied_rooms': current_occupied
        })
        
        prev_week_data.append({
            'day': prev_day.strftime('%A'),
            'date': prev_day.strftime('%Y-%m-%d'),
            'occupancy': round(prev_occupancy, 1),
            'occupied_rooms': prev_occupied
        })
    
    # Latest news (using calendar events as news)
    latest_news = []
    recent_events = CalendarEvent.objects.filter(
        start_datetime__gte=now - timedelta(days=7),
        event_type__in=['EVENT', 'MEETING']
    ).order_by('-start_datetime')[:5]
    
    for event in recent_events:
        latest_news.append({
            'id': event.id,
            'title': event.title,
            'description': event.description[:100] + '...' if len(event.description) > 100 else event.description,
            'date': event.start_datetime.strftime('%Y-%m-%d'),
            'time': event.start_datetime.strftime('%H:%M'),
            'type': event.event_type,
            'location': event.location
        })
    
    # Upcoming calendar events (next 7 days)
    upcoming_events = CalendarEvent.objects.filter(
        start_datetime__gte=now,
        start_datetime__lte=now + timedelta(days=7)
    ).order_by('start_datetime')[:10]
    
    calendar_data = []
    for event in upcoming_events:
        calendar_data.append({
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'start_date': event.start_datetime.strftime('%Y-%m-%d'),
            'start_time': event.start_datetime.strftime('%H:%M'),
            'end_date': event.end_datetime.strftime('%Y-%m-%d'),
            'end_time': event.end_datetime.strftime('%H:%M'),
            'type': event.event_type,
            'location': event.location,
            'status': event.status,
            'all_day': event.all_day
        })
    
    # Indonesian holidays this month
    current_month_start = today.replace(day=1)
    next_month = current_month_start.replace(month=current_month_start.month + 1) if current_month_start.month < 12 else current_month_start.replace(year=current_month_start.year + 1, month=1)
    
    holidays_this_month = Holiday.objects.filter(
        date__gte=current_month_start,
        date__lt=next_month
    ).order_by('date')
    
    holidays_data = []
    for holiday in holidays_this_month:
        holidays_data.append({
            'id': holiday.id,
            'name': holiday.name,
            'name_id': holiday.name_id,
            'date': holiday.date.strftime('%Y-%m-%d'),
            'type': holiday.holiday_type,
            'description': holiday.description
        })
    
    # Additional metrics
    # Average daily rate (ADR)
    recent_reservations = Reservation.objects.filter(
        check_in_date__gte=recent_date,
        status__in=['CHECKED_IN', 'CHECKED_OUT']
    )
    
    if recent_reservations.exists():
        total_revenue = sum(float(res.total_amount) for res in recent_reservations)
        total_room_nights = sum(res.nights for res in recent_reservations)
        adr = total_revenue / total_room_nights if total_room_nights > 0 else 0
    else:
        adr = 0
    
    # Revenue per available room (RevPAR)
    days_in_period = 30
    total_available_room_nights = total_rooms * days_in_period
    revpar = (total_revenue / total_available_room_nights) if total_available_room_nights > 0 and recent_reservations.exists() else 0
    
    # Prepare response data
    dashboard_data = {
        'basic_metrics': {
            'total_rooms': total_rooms,
            'occupancy_rate': round(occupancy_rate, 1),
            'active_guests': active_guests,
            'todays_checkins': todays_checkins,
            'adr': round(adr, 0),  # Average Daily Rate in IDR
            'revpar': round(revpar, 0)  # Revenue per Available Room in IDR
        },
        'visitor_demographics': {
            'total_visitors': total_visitors,
            'data': demographics_data
        },
        'weekly_comparison': {
            'current_week': {
                'period': f"{week_start.strftime('%Y-%m-%d')} to {week_end.strftime('%Y-%m-%d')}",
                'data': current_week_data
            },
            'previous_month_week': {
                'period': f"{prev_month_start.strftime('%Y-%m-%d')} to {prev_month_end.strftime('%Y-%m-%d')}",
                'data': prev_week_data
            }
        },
        'latest_news': latest_news,
        'upcoming_events': calendar_data,
        'holidays_this_month': holidays_data,
        'last_updated': now.strftime('%Y-%m-%d %H:%M:%S')
    }
    
    return Response(dashboard_data)