from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django.db.models import Count, Q, Avg
from datetime import timedelta, date
from collections import defaultdict

from ..models import Reservation, Room, RoomType


@api_view(['GET'])
@permission_classes([AllowAny])
def occupancy_analytics(request):
    """
    Comprehensive occupancy analytics for daily, monthly, and yearly views
    """
    period = request.GET.get('period', 'thisMonth')  # thisMonth, lastMonth, thisYear, custom
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')

    today = timezone.now().date()

    # Calculate date range based on period
    if period == 'today':
        start_date = today
        end_date = today
    elif period == 'yesterday':
        start_date = today - timedelta(days=1)
        end_date = start_date
    elif period == 'thisWeek':
        start_date = today - timedelta(days=today.weekday())
        end_date = today
    elif period == 'lastWeek':
        start_date = today - timedelta(days=today.weekday() + 7)
        end_date = start_date + timedelta(days=6)
    elif period == 'thisMonth':
        start_date = today.replace(day=1)
        end_date = today
    elif period == 'lastMonth':
        last_month_end = today.replace(day=1) - timedelta(days=1)
        start_date = last_month_end.replace(day=1)
        end_date = last_month_end
    elif period == 'thisYear':
        start_date = today.replace(month=1, day=1)
        end_date = today
    elif period == 'lastYear':
        start_date = date(today.year - 1, 1, 1)
        end_date = date(today.year - 1, 12, 31)
    elif period == 'custom' and start_date_str and end_date_str:
        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)
    else:
        start_date = today.replace(day=1)
        end_date = today

    # Get total active rooms
    total_rooms = Room.objects.filter(is_active=True).count()
    room_types = RoomType.objects.all()

    # === DAILY OCCUPANCY DATA ===
    daily_data = []
    current_date = start_date
    while current_date <= end_date:
        # Get reservations that overlap with current_date
        occupied_rooms = Reservation.objects.filter(
            check_in_date__lte=current_date,
            check_out_date__gt=current_date,
            status__in=['CHECKED_IN', 'CONFIRMED', 'CHECKED_OUT']
        ).select_related('room', 'room__room_type').values_list('room', flat=True).distinct().count()

        # Count by room type
        room_type_occupancy = {}
        for room_type in room_types:
            type_total = Room.objects.filter(room_type=room_type, is_active=True).count()
            type_occupied = Reservation.objects.filter(
                check_in_date__lte=current_date,
                check_out_date__gt=current_date,
                status__in=['CHECKED_IN', 'CONFIRMED', 'CHECKED_OUT'],
                room__room_type=room_type
            ).values_list('room', flat=True).distinct().count()

            room_type_occupancy[room_type.name] = {
                'occupied': type_occupied,
                'total': type_total,
                'rate': round((type_occupied / type_total * 100), 1) if type_total > 0 else 0
            }

        occupancy_rate = round((occupied_rooms / total_rooms * 100), 1) if total_rooms > 0 else 0

        # Count check-ins and check-outs for this day
        checkins = Reservation.objects.filter(check_in_date=current_date).count()
        checkouts = Reservation.objects.filter(check_out_date=current_date).count()

        # Calculate revenue for this day (if needed)
        from ..models import Payment
        daily_revenue = Payment.objects.filter(
            payment_date__date=current_date,
            status='COMPLETED'
        ).aggregate(total=Count('amount'))

        daily_data.append({
            'date': current_date.isoformat(),
            'day_name': current_date.strftime('%A'),
            'occupied_rooms': occupied_rooms,
            'available_rooms': total_rooms - occupied_rooms,
            'total_rooms': total_rooms,
            'occupancy_rate': occupancy_rate,
            'checkins': checkins,
            'checkouts': checkouts,
            'room_type_occupancy': room_type_occupancy
        })

        current_date += timedelta(days=1)

    # === SUMMARY STATISTICS ===
    total_days = len(daily_data)
    average_occupancy = sum(day['occupancy_rate'] for day in daily_data) / total_days if total_days > 0 else 0
    peak_occupancy = max((day['occupancy_rate'] for day in daily_data), default=0)
    lowest_occupancy = min((day['occupancy_rate'] for day in daily_data), default=0)

    # Find peak and lowest days
    peak_day = max(daily_data, key=lambda x: x['occupancy_rate']) if daily_data else None
    lowest_day = min(daily_data, key=lambda x: x['occupancy_rate']) if daily_data else None

    # Total room nights sold (sum of occupied rooms across all days)
    total_room_nights_sold = sum(day['occupied_rooms'] for day in daily_data)
    total_room_nights_available = total_rooms * total_days

    # === MONTHLY COMPARISON (for yearly view) ===
    monthly_data = []
    if period in ['thisYear', 'lastYear']:
        year = start_date.year
        for month_num in range(1, 13):
            if month_num > end_date.month and year == end_date.year:
                break

            month_start = date(year, month_num, 1)
            if month_num == 12:
                month_end = date(year, 12, 31)
            else:
                month_end = date(year, month_num + 1, 1) - timedelta(days=1)

            # Don't include future months
            if month_start > today:
                break
            if month_end > today:
                month_end = today

            # Calculate monthly occupancy
            month_days = []
            current = month_start
            while current <= month_end:
                occupied = Reservation.objects.filter(
                    check_in_date__lte=current,
                    check_out_date__gt=current,
                    status__in=['CHECKED_IN', 'CONFIRMED', 'CHECKED_OUT']
                ).values_list('room', flat=True).distinct().count()

                month_days.append({
                    'occupied': occupied,
                    'rate': (occupied / total_rooms * 100) if total_rooms > 0 else 0
                })
                current += timedelta(days=1)

            avg_monthly_occupancy = sum(d['rate'] for d in month_days) / len(month_days) if month_days else 0
            total_monthly_room_nights = sum(d['occupied'] for d in month_days)

            monthly_data.append({
                'month': month_num,
                'month_name': date(year, month_num, 1).strftime('%B'),
                'year': year,
                'average_occupancy': round(avg_monthly_occupancy, 1),
                'total_room_nights': total_monthly_room_nights,
                'days_in_month': len(month_days)
            })

    # === ROOM TYPE SUMMARY ===
    room_type_summary = []
    for room_type in room_types:
        type_total = Room.objects.filter(room_type=room_type, is_active=True).count()

        # Calculate average occupancy for this room type across the period
        type_occupancy_rates = []
        current = start_date
        while current <= end_date:
            type_occupied = Reservation.objects.filter(
                check_in_date__lte=current,
                check_out_date__gt=current,
                status__in=['CHECKED_IN', 'CONFIRMED', 'CHECKED_OUT'],
                room__room_type=room_type
            ).values_list('room', flat=True).distinct().count()

            rate = (type_occupied / type_total * 100) if type_total > 0 else 0
            type_occupancy_rates.append(rate)
            current += timedelta(days=1)

        avg_type_occupancy = sum(type_occupancy_rates) / len(type_occupancy_rates) if type_occupancy_rates else 0

        room_type_summary.append({
            'room_type': room_type.name,
            'total_rooms': type_total,
            'average_occupancy': round(avg_type_occupancy, 1),
            'base_price': float(room_type.base_price)
        })

    # === TODAY'S SNAPSHOT ===
    today_occupied = Reservation.objects.filter(
        check_in_date__lte=today,
        check_out_date__gt=today,
        status__in=['CHECKED_IN', 'CONFIRMED']
    ).count()

    today_snapshot = {
        'date': today.isoformat(),
        'occupied_rooms': today_occupied,
        'available_rooms': total_rooms - today_occupied,
        'occupancy_rate': round((today_occupied / total_rooms * 100), 1) if total_rooms > 0 else 0,
        'checkins_today': Reservation.objects.filter(check_in_date=today).count(),
        'checkouts_today': Reservation.objects.filter(check_out_date=today).count(),
        'checkins_tomorrow': Reservation.objects.filter(check_in_date=today + timedelta(days=1)).count(),
        'checkouts_tomorrow': Reservation.objects.filter(check_out_date=today + timedelta(days=1)).count(),
    }

    # === RESPONSE ===
    return Response({
        'period': period,
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
        'today_snapshot': today_snapshot,
        'summary': {
            'total_rooms': total_rooms,
            'average_occupancy': round(average_occupancy, 1),
            'peak_occupancy': round(peak_occupancy, 1),
            'lowest_occupancy': round(lowest_occupancy, 1),
            'peak_day': peak_day['date'] if peak_day else None,
            'lowest_day': lowest_day['date'] if lowest_day else None,
            'total_room_nights_sold': total_room_nights_sold,
            'total_room_nights_available': total_room_nights_available,
            'total_days': total_days
        },
        'daily_data': daily_data,
        'monthly_data': monthly_data,
        'room_type_summary': room_type_summary
    })
