from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q, F
from django.db.models.functions import TruncDate
from datetime import timedelta, datetime
from decimal import Decimal

from ..models import (
    Reservation, Payment, Room, Guest, Complaint, CheckIn
)


@api_view(['GET'])
def dashboard_analytics(request):
    """
    Comprehensive analytics for manager dashboard
    Returns daily, weekly, and monthly metrics
    """
    today = timezone.now().date()

    # Date ranges
    last_7_days = today - timedelta(days=6)  # Including today = 7 days
    last_30_days = today - timedelta(days=29)  # Including today = 30 days
    start_of_month = today.replace(day=1)

    # === TODAY'S METRICS ===
    today_checkins = Reservation.objects.filter(check_in_date=today).count()
    today_checkouts = Reservation.objects.filter(check_out_date=today).count()
    today_payments = Payment.objects.filter(
        payment_date__date=today,
        status='COMPLETED'
    ).aggregate(total=Sum('amount'))['total'] or 0

    # === OCCUPANCY METRICS ===
    total_rooms = Room.objects.filter(is_active=True).count()
    occupied_today = Reservation.objects.filter(
        check_in_date__lte=today,
        check_out_date__gt=today,
        status__in=['CHECKED_IN', 'CONFIRMED']
    ).count()
    occupancy_rate = (occupied_today / total_rooms * 100) if total_rooms > 0 else 0

    # === REVENUE METRICS ===
    # This month revenue
    month_revenue = Payment.objects.filter(
        payment_date__date__gte=start_of_month,
        payment_date__date__lte=today,
        status='COMPLETED'
    ).aggregate(total=Sum('amount'))['total'] or 0

    # Last 30 days revenue
    revenue_30_days = Payment.objects.filter(
        payment_date__date__gte=last_30_days,
        payment_date__date__lte=today,
        status='COMPLETED'
    ).aggregate(total=Sum('amount'))['total'] or 0

    # Average daily revenue (last 30 days)
    avg_daily_revenue = float(revenue_30_days) / 30 if revenue_30_days else 0

    # === DAILY REVENUE CHART (Last 7 days) ===
    daily_revenue = Payment.objects.filter(
        payment_date__date__gte=last_7_days,
        payment_date__date__lte=today,
        status='COMPLETED'
    ).annotate(
        date=TruncDate('payment_date')
    ).values('date').annotate(
        revenue=Sum('amount'),
        transactions=Count('id')
    ).order_by('date')

    # Fill missing dates with zero
    revenue_chart = []
    current_date = last_7_days
    daily_revenue_dict = {item['date']: item for item in daily_revenue}

    while current_date <= today:
        data = daily_revenue_dict.get(current_date, {'revenue': 0, 'transactions': 0})
        revenue_chart.append({
            'date': current_date.isoformat(),
            'revenue': float(data['revenue']) if data['revenue'] else 0,
            'transactions': data['transactions']
        })
        current_date += timedelta(days=1)

    # === OCCUPANCY CHART (Last 7 days) ===
    occupancy_chart = []
    current_date = last_7_days

    while current_date <= today:
        occupied = Reservation.objects.filter(
            check_in_date__lte=current_date,
            check_out_date__gt=current_date,
            status__in=['CHECKED_IN', 'CHECKED_OUT', 'CONFIRMED']
        ).count()

        occupancy_chart.append({
            'date': current_date.isoformat(),
            'occupied': occupied,
            'available': total_rooms - occupied,
            'occupancy_rate': round((occupied / total_rooms * 100) if total_rooms > 0 else 0, 2)
        })
        current_date += timedelta(days=1)

    # === PAYMENT METHOD BREAKDOWN (Last 30 days) ===
    payment_methods = Payment.objects.filter(
        payment_date__date__gte=last_30_days,
        payment_date__date__lte=today,
        status='COMPLETED'
    ).values('payment_method').annotate(
        total=Sum('amount'),
        count=Count('id')
    ).order_by('-total')

    payment_methods_chart = [
        {
            'method': item['payment_method'],
            'method_display': dict(Payment.PAYMENT_METHOD_CHOICES).get(item['payment_method'], item['payment_method']),
            'total': float(item['total']),
            'count': item['count'],
            'percentage': round((float(item['total']) / float(revenue_30_days) * 100) if revenue_30_days else 0, 2)
        }
        for item in payment_methods
    ]

    # === BOOKING SOURCE BREAKDOWN (Last 30 days) ===
    booking_sources = Reservation.objects.filter(
        check_in_date__gte=last_30_days,
        check_in_date__lte=today
    ).values('booking_source').annotate(
        count=Count('id'),
        revenue=Sum('total_amount')
    ).order_by('-count')

    booking_sources_chart = [
        {
            'source': item['booking_source'],
            'source_display': dict(Reservation.BOOKING_SOURCE_CHOICES).get(item['booking_source'], item['booking_source']),
            'count': item['count'],
            'revenue': float(item['revenue']) if item['revenue'] else 0
        }
        for item in booking_sources
    ]

    # === ROOM TYPE PERFORMANCE (Last 30 days) ===
    room_performance = Reservation.objects.filter(
        check_in_date__gte=last_30_days,
        check_in_date__lte=today
    ).values(
        'room__room_type__name'
    ).annotate(
        bookings=Count('id'),
        revenue=Sum('total_amount'),
        avg_stay=Avg(F('check_out_date') - F('check_in_date'))
    ).order_by('-revenue')

    room_types_chart = [
        {
            'room_type': item['room__room_type__name'],
            'bookings': item['bookings'],
            'revenue': float(item['revenue']) if item['revenue'] else 0,
            'avg_nights': round(item['avg_stay'].days if item['avg_stay'] else 0, 1)
        }
        for item in room_performance
    ]

    # === GUEST STATISTICS ===
    total_guests = Guest.objects.count()
    vip_guests = Guest.objects.filter(is_vip=True).count()
    # Count guests who made their first reservation this month
    new_guests_this_month = Reservation.objects.filter(
        check_in_date__gte=start_of_month
    ).values('guest').distinct().count()

    # Top nationalities (last 30 days)
    top_nationalities = Reservation.objects.filter(
        check_in_date__gte=last_30_days
    ).values('guest__nationality').annotate(
        count=Count('id')
    ).order_by('-count')[:5]

    nationalities_chart = [
        {
            'nationality': item['guest__nationality'],
            'count': item['count']
        }
        for item in top_nationalities
    ]

    # === COMPLAINTS METRICS ===
    active_complaints = Complaint.objects.filter(
        status__in=['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS']
    ).count()

    urgent_complaints = Complaint.objects.filter(
        priority='URGENT',
        status__in=['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS']
    ).count()

    resolved_this_month = Complaint.objects.filter(
        status='RESOLVED',
        updated_at__gte=start_of_month
    ).count()

    # === AVERAGE METRICS ===
    avg_stay_duration = Reservation.objects.filter(
        check_in_date__gte=last_30_days,
        status__in=['CHECKED_OUT', 'CHECKED_IN']
    ).aggregate(
        avg_duration=Avg(F('check_out_date') - F('check_in_date'))
    )['avg_duration']

    avg_nights = round(avg_stay_duration.days if avg_stay_duration else 0, 1)

    avg_booking_value = Reservation.objects.filter(
        check_in_date__gte=last_30_days
    ).aggregate(avg=Avg('total_amount'))['avg'] or 0

    # === UPCOMING METRICS ===
    upcoming_checkins = Reservation.objects.filter(
        check_in_date=today + timedelta(days=1),
        status='CONFIRMED'
    ).count()

    upcoming_checkouts = Reservation.objects.filter(
        check_out_date=today + timedelta(days=1)
    ).count()

    return Response({
        'today': {
            'date': today.isoformat(),
            'checkins': today_checkins,
            'checkouts': today_checkouts,
            'revenue': float(today_payments),
            'occupancy_rate': round(occupancy_rate, 2),
            'occupied_rooms': occupied_today,
            'available_rooms': total_rooms - occupied_today
        },
        'summary': {
            'total_rooms': total_rooms,
            'total_guests': total_guests,
            'vip_guests': vip_guests,
            'new_guests_this_month': new_guests_this_month,
            'active_complaints': active_complaints,
            'urgent_complaints': urgent_complaints,
            'resolved_complaints_this_month': resolved_this_month
        },
        'revenue': {
            'today': float(today_payments),
            'this_month': float(month_revenue),
            'last_30_days': float(revenue_30_days),
            'avg_daily': round(avg_daily_revenue, 2)
        },
        'averages': {
            'stay_duration_nights': avg_nights,
            'booking_value': float(avg_booking_value)
        },
        'upcoming': {
            'tomorrow_checkins': upcoming_checkins,
            'tomorrow_checkouts': upcoming_checkouts
        },
        'charts': {
            'daily_revenue': revenue_chart,
            'occupancy': occupancy_chart,
            'payment_methods': payment_methods_chart,
            'booking_sources': booking_sources_chart,
            'room_types': room_types_chart,
            'nationalities': nationalities_chart
        }
    })


@api_view(['GET'])
def monthly_comparison(request):
    """
    Compare current month with previous month
    """
    today = timezone.now().date()
    current_month_start = today.replace(day=1)

    # Previous month
    if today.month == 1:
        prev_month_start = today.replace(year=today.year - 1, month=12, day=1)
        prev_month_end = today.replace(year=today.year, month=1, day=1) - timedelta(days=1)
    else:
        prev_month_start = today.replace(month=today.month - 1, day=1)
        # Last day of previous month
        prev_month_end = current_month_start - timedelta(days=1)

    # Current month metrics
    current_revenue = Payment.objects.filter(
        payment_date__date__gte=current_month_start,
        payment_date__date__lte=today,
        status='COMPLETED'
    ).aggregate(total=Sum('amount'))['total'] or 0

    current_bookings = Reservation.objects.filter(
        check_in_date__gte=current_month_start,
        check_in_date__lte=today
    ).count()

    # Previous month metrics (full month)
    prev_revenue = Payment.objects.filter(
        payment_date__date__gte=prev_month_start,
        payment_date__date__lte=prev_month_end,
        status='COMPLETED'
    ).aggregate(total=Sum('amount'))['total'] or 0

    prev_bookings = Reservation.objects.filter(
        check_in_date__gte=prev_month_start,
        check_in_date__lte=prev_month_end
    ).count()

    # Calculate percentage changes
    revenue_change = ((float(current_revenue) - float(prev_revenue)) / float(prev_revenue) * 100) if prev_revenue else 0
    bookings_change = ((current_bookings - prev_bookings) / prev_bookings * 100) if prev_bookings else 0

    return Response({
        'current_month': {
            'start_date': current_month_start.isoformat(),
            'end_date': today.isoformat(),
            'revenue': float(current_revenue),
            'bookings': current_bookings
        },
        'previous_month': {
            'start_date': prev_month_start.isoformat(),
            'end_date': prev_month_end.isoformat(),
            'revenue': float(prev_revenue),
            'bookings': prev_bookings
        },
        'comparison': {
            'revenue_change_percent': round(revenue_change, 2),
            'bookings_change_percent': round(bookings_change, 2),
            'revenue_growth': 'up' if revenue_change > 0 else 'down' if revenue_change < 0 else 'stable',
            'bookings_growth': 'up' if bookings_change > 0 else 'down' if bookings_change < 0 else 'stable'
        }
    })
