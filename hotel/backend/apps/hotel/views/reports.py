from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta, date
from decimal import Decimal

from ..models import (
    MaintenanceRequest, MaintenanceTechnician,
    Reservation, Payment, Room, Guest,
    InventoryItem, Expense, Complaint
)


@api_view(['GET'])
@permission_classes([AllowAny])
def daily_reports(request):
    """Get daily maintenance reports"""
    # Get date parameter or default to today
    date_str = request.GET.get('date')
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            target_date = date.today()
    else:
        target_date = date.today()
    
    # Get maintenance requests for the target date
    start_datetime = datetime.combine(target_date, datetime.min.time())
    end_datetime = datetime.combine(target_date, datetime.max.time())
    
    daily_requests = MaintenanceRequest.objects.filter(
        requested_date__range=[start_datetime, end_datetime]
    )
    
    # Calculate metrics
    total_requests = daily_requests.count()
    completed = daily_requests.filter(status='COMPLETED').count()
    pending = daily_requests.filter(status__in=['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS']).count()
    urgent = daily_requests.filter(priority='URGENT').count()
    
    # Calculate average resolution time
    completed_requests = daily_requests.filter(
        status='COMPLETED',
        completed_date__isnull=False
    )
    
    if completed_requests.exists():
        total_hours = 0
        count = 0
        for req in completed_requests:
            if req.resolution_time_hours:
                total_hours += req.resolution_time_hours
                count += 1
        average_resolution_time = round(total_hours / count, 1) if count > 0 else 0
    else:
        average_resolution_time = 0
    
    # Calculate cost
    cost_incurred = daily_requests.aggregate(
        total=Sum('actual_cost')
    )['total'] or Decimal('0')
    
    # Get top category
    top_category_data = daily_requests.values('category').annotate(
        count=Count('id')
    ).order_by('-count').first()
    
    top_category = top_category_data['category'] if top_category_data else 'N/A'
    
    # Calculate efficiency rate
    if total_requests > 0:
        efficiency_rate = round((completed / total_requests) * 100)
    else:
        efficiency_rate = 0
    
    report_data = {
        'date': target_date.strftime('%Y-%m-%d'),
        'total_requests': total_requests,
        'completed': completed,
        'pending': pending,
        'urgent': urgent,
        'average_resolution_time': average_resolution_time,
        'cost_incurred': float(cost_incurred),
        'top_category': top_category,
        'efficiency_rate': efficiency_rate
    }
    
    return Response(report_data)


@api_view(['GET'])
@permission_classes([AllowAny])
def daily_reports_range(request):
    """Get daily reports for a date range (last 7 days by default)"""
    days = int(request.GET.get('days', 7))
    reports = []
    
    for i in range(days):
        target_date = date.today() - timedelta(days=i)
        
        # Get maintenance requests for the target date
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())
        
        daily_requests = MaintenanceRequest.objects.filter(
            requested_date__range=[start_datetime, end_datetime]
        )
        
        # Calculate metrics
        total_requests = daily_requests.count()
        completed = daily_requests.filter(status='COMPLETED').count()
        pending = daily_requests.filter(status__in=['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS']).count()
        urgent = daily_requests.filter(priority='URGENT').count()
        
        # Calculate average resolution time
        completed_requests = daily_requests.filter(
            status='COMPLETED',
            completed_date__isnull=False
        )
        
        if completed_requests.exists():
            total_hours = 0
            count = 0
            for req in completed_requests:
                if req.resolution_time_hours:
                    total_hours += req.resolution_time_hours
                    count += 1
            average_resolution_time = round(total_hours / count, 1) if count > 0 else 0
        else:
            average_resolution_time = 0
        
        # Calculate cost
        cost_incurred = daily_requests.aggregate(
            total=Sum('actual_cost')
        )['total'] or Decimal('0')
        
        # Get top category
        top_category_data = daily_requests.values('category').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        top_category = top_category_data['category'] if top_category_data else 'N/A'
        
        # Calculate efficiency rate
        if total_requests > 0:
            efficiency_rate = round((completed / total_requests) * 100)
        else:
            efficiency_rate = 0
        
        report_data = {
            'date': target_date.strftime('%Y-%m-%d'),
            'total_requests': total_requests,
            'completed': completed,
            'pending': pending,
            'urgent': urgent,
            'average_resolution_time': average_resolution_time,
            'cost_incurred': float(cost_incurred),
            'top_category': top_category,
            'efficiency_rate': efficiency_rate
        }
        
        reports.append(report_data)
    
    return Response(reports)


@api_view(['GET'])
@permission_classes([AllowAny])
def monthly_reports(request):
    """Get monthly maintenance reports"""
    # Get month/year parameters or default to current month
    month_str = request.GET.get('month')
    year_str = request.GET.get('year')
    
    if month_str and year_str:
        try:
            month = int(month_str)
            year = int(year_str)
        except ValueError:
            month = date.today().month
            year = date.today().year
    else:
        month = date.today().month
        year = date.today().year
    
    # Get maintenance requests for the target month
    monthly_requests = MaintenanceRequest.objects.filter(
        requested_date__year=year,
        requested_date__month=month
    )
    
    # Calculate metrics
    total_requests = monthly_requests.count()
    completed = monthly_requests.filter(status='COMPLETED').count()
    pending = monthly_requests.filter(status__in=['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS']).count()
    cancelled = monthly_requests.filter(status='CANCELLED').count()
    
    # Calculate costs
    total_cost = monthly_requests.aggregate(
        total=Sum('actual_cost')
    )['total'] or Decimal('0')
    
    average_cost_per_request = float(total_cost / total_requests) if total_requests > 0 else 0
    
    # Calculate trend comparison (vs previous month)
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    
    prev_month_requests = MaintenanceRequest.objects.filter(
        requested_date__year=prev_year,
        requested_date__month=prev_month
    ).count()
    
    if prev_month_requests > 0:
        trend_comparison = round(((total_requests - prev_month_requests) / prev_month_requests) * 100, 1)
    else:
        trend_comparison = 0
    
    # Get technician performance
    technician_performance = []
    technicians = MaintenanceTechnician.objects.filter(is_active=True)
    
    for tech in technicians:
        monthly_completed = monthly_requests.filter(
            assigned_technician=tech.name,
            status='COMPLETED'
        )
        
        requests_completed = monthly_completed.count()
        
        if requests_completed > 0:
            # Calculate average time
            total_hours = 0
            time_count = 0
            for req in monthly_completed:
                if req.resolution_time_hours:
                    total_hours += req.resolution_time_hours
                    time_count += 1
            
            average_time = round(total_hours / time_count, 1) if time_count > 0 else 0
            
            # Calculate efficiency score
            efficiency_scores = [req.efficiency_score for req in monthly_completed if req.efficiency_score]
            efficiency_score = round(sum(efficiency_scores) / len(efficiency_scores)) if efficiency_scores else 0
            
            # Calculate customer satisfaction
            satisfaction_ratings = [req.customer_satisfaction for req in monthly_completed if req.customer_satisfaction]
            customer_satisfaction = round(sum(satisfaction_ratings) / len(satisfaction_ratings), 1) if satisfaction_ratings else 0
            
            technician_performance.append({
                'id': tech.id,
                'name': tech.name,
                'requests_completed': requests_completed,
                'average_time': average_time,
                'efficiency_score': efficiency_score,
                'customer_satisfaction': customer_satisfaction
            })
    
    # Sort by efficiency score
    technician_performance.sort(key=lambda x: x['efficiency_score'], reverse=True)
    
    # Get category breakdown
    category_breakdown = []
    category_data = monthly_requests.values('category').annotate(
        count=Count('id'),
        total_cost=Sum('actual_cost')
    ).order_by('-count')
    
    for cat_data in category_data:
        percentage = round((cat_data['count'] / total_requests) * 100, 1) if total_requests > 0 else 0
        category_breakdown.append({
            'category': cat_data['category'],
            'count': cat_data['count'],
            'percentage': percentage,
            'total_cost': float(cat_data['total_cost'] or 0)
        })
    
    # Get month name
    month_names = [
        '', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    month_name = month_names[month]
    
    report_data = {
        'month': month_name,
        'year': year,
        'total_requests': total_requests,
        'completed': completed,
        'pending': pending,
        'cancelled': cancelled,
        'total_cost': float(total_cost),
        'average_cost_per_request': average_cost_per_request,
        'trend_comparison': trend_comparison,
        'technician_performance': technician_performance,
        'category_breakdown': category_breakdown
    }

    return Response(report_data)


@api_view(['GET'])
@permission_classes([AllowAny])
def report_summary(request):
    """Get overall report summary for dashboard"""
    # Get period parameter (thisMonth, lastMonth, thisQuarter, thisYear)
    period = request.GET.get('period', 'thisMonth')

    # Calculate date range
    today = date.today()
    if period == 'thisMonth':
        start_date = date(today.year, today.month, 1)
        end_date = today
    elif period == 'lastMonth':
        last_month = today.replace(day=1) - timedelta(days=1)
        start_date = date(last_month.year, last_month.month, 1)
        end_date = date(last_month.year, last_month.month, 1) + timedelta(days=32)
        end_date = end_date.replace(day=1) - timedelta(days=1)
    elif period == 'thisQuarter':
        quarter = (today.month - 1) // 3
        start_date = date(today.year, quarter * 3 + 1, 1)
        end_date = today
    elif period == 'thisYear':
        start_date = date(today.year, 1, 1)
        end_date = today
    else:
        start_date = date(today.year, today.month, 1)
        end_date = today

    # Convert to datetime
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Total bookings
    total_bookings = Reservation.objects.filter(
        created_at__range=[start_datetime, end_datetime]
    ).count()

    # Check-ins and check-outs
    check_ins = Reservation.objects.filter(
        check_in_date__range=[start_datetime, end_datetime],
        status__in=['CHECKED_IN', 'CHECKED_OUT']
    ).count()

    check_outs = Reservation.objects.filter(
        check_out_date__range=[start_datetime, end_datetime],
        status='CHECKED_OUT'
    ).count()

    # Pending reservations
    pending_reservations = Reservation.objects.filter(
        status='CONFIRMED',
        check_in_date__gte=start_datetime
    ).count()

    # Calculate occupancy rate
    total_rooms = Room.objects.filter(is_active=True).count()
    occupied_rooms = Room.objects.filter(
        is_active=True,
        status='OCCUPIED'
    ).count()
    occupancy_rate = round((occupied_rooms / total_rooms * 100), 1) if total_rooms > 0 else 0

    # Calculate average revenue
    total_revenue = Payment.objects.filter(
        payment_date__range=[start_datetime, end_datetime],
        status='COMPLETED'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

    days_in_period = (end_date - start_date).days + 1
    average_revenue = float(total_revenue / days_in_period) if days_in_period > 0 else 0

    # Guest satisfaction (from complaints - inverse metric)
    total_complaints = Complaint.objects.filter(
        created_at__range=[start_datetime, end_datetime]
    ).count()

    # Mock satisfaction score based on complaints (fewer complaints = higher satisfaction)
    if total_bookings > 0:
        complaint_rate = total_complaints / total_bookings
        guest_satisfaction = max(3.5, min(5.0, 5.0 - (complaint_rate * 10)))
    else:
        guest_satisfaction = 4.5

    return Response({
        'total_bookings': total_bookings,
        'occupancy_rate': occupancy_rate,
        'average_revenue': average_revenue,
        'guest_satisfaction': round(guest_satisfaction, 1),
        'check_ins': check_ins,
        'check_outs': check_outs,
        'pending_reservations': pending_reservations
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def available_reports(request):
    """Get list of available reports with their status"""
    today = date.today()

    # Calculate last generation dates and statuses
    reports = [
        {
            'id': 'occupancy',
            'title': 'Laporan Okupansi',
            'description': 'Tingkat okupansi kamar harian, bulanan dan tahunan',
            'category': 'operations',
            'last_generated': today.strftime('%Y-%m-%d'),
            'status': 'ready'
        },
        {
            'id': 'revenue',
            'title': 'Laporan Pendapatan',
            'description': 'Analisis pendapatan dari kamar, F&B, dan layanan tambahan',
            'category': 'financial',
            'last_generated': today.strftime('%Y-%m-%d'),
            'status': 'ready'
        },
        {
            'id': 'guest-analytics',
            'title': 'Analisis Tamu',
            'description': 'Demografi tamu, preferensi, dan pola booking',
            'category': 'guest',
            'last_generated': (today - timedelta(days=1)).strftime('%Y-%m-%d'),
            'status': 'ready'
        },
        {
            'id': 'staff-performance',
            'title': 'Performa Karyawan',
            'description': 'Evaluasi kinerja dan produktivitas karyawan',
            'category': 'hr',
            'last_generated': (today - timedelta(days=2)).strftime('%Y-%m-%d'),
            'status': 'ready'
        },
        {
            'id': 'satisfaction',
            'title': 'Survei Kepuasan',
            'description': 'Rating dan review tamu, analisis feedback',
            'category': 'guest',
            'last_generated': (today - timedelta(days=3)).strftime('%Y-%m-%d'),
            'status': 'ready'
        },
        {
            'id': 'maintenance',
            'title': 'Laporan Maintenance',
            'description': 'Status pemeliharaan fasilitas dan equipment',
            'category': 'operations',
            'last_generated': today.strftime('%Y-%m-%d'),
            'status': 'ready'
        },
        {
            'id': 'inventory',
            'title': 'Laporan Inventaris',
            'description': 'Stock amenities, supplies, dan kebutuhan operasional',
            'category': 'operations',
            'last_generated': (today - timedelta(days=1)).strftime('%Y-%m-%d'),
            'status': 'ready'
        },
        {
            'id': 'tax',
            'title': 'Laporan Pajak',
            'description': 'Pajak hotel, PPN, dan kewajiban perpajakan',
            'category': 'financial',
            'last_generated': (today - timedelta(days=8)).strftime('%Y-%m-%d'),
            'status': 'outdated'
        }
    ]

    return Response(reports)


@api_view(['GET'])
@permission_classes([AllowAny])
def occupancy_report(request):
    """Generate occupancy report"""
    period = request.GET.get('period', 'thisMonth')

    # Calculate date range
    today = date.today()
    if period == 'thisMonth':
        start_date = date(today.year, today.month, 1)
        end_date = today
    elif period == 'lastMonth':
        last_month = today.replace(day=1) - timedelta(days=1)
        start_date = date(last_month.year, last_month.month, 1)
        end_date = date(last_month.year, last_month.month, 1) + timedelta(days=32)
        end_date = end_date.replace(day=1) - timedelta(days=1)
    else:
        start_date = date(today.year, today.month, 1)
        end_date = today

    total_rooms = Room.objects.filter(is_active=True).count()

    # Daily occupancy data
    daily_data = []
    current_date = start_date
    while current_date <= end_date:
        occupied = Reservation.objects.filter(
            check_in_date__lte=current_date,
            check_out_date__gt=current_date,
            status__in=['CHECKED_IN', 'CHECKED_OUT']
        ).count()

        occupancy_rate = round((occupied / total_rooms * 100), 1) if total_rooms > 0 else 0

        daily_data.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'occupied_rooms': occupied,
            'total_rooms': total_rooms,
            'occupancy_rate': occupancy_rate
        })

        current_date += timedelta(days=1)

    # Calculate average occupancy
    avg_occupancy = sum(day['occupancy_rate'] for day in daily_data) / len(daily_data) if daily_data else 0

    return Response({
        'period': period,
        'average_occupancy': round(avg_occupancy, 1),
        'total_rooms': total_rooms,
        'daily_data': daily_data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def revenue_report(request):
    """Generate revenue report"""
    period = request.GET.get('period', 'thisMonth')

    # Calculate date range
    today = date.today()
    if period == 'thisMonth':
        start_date = date(today.year, today.month, 1)
        end_date = today
    elif period == 'lastMonth':
        last_month = today.replace(day=1) - timedelta(days=1)
        start_date = date(last_month.year, last_month.month, 1)
        end_date = date(last_month.year, last_month.month, 1) + timedelta(days=32)
        end_date = end_date.replace(day=1) - timedelta(days=1)
    else:
        start_date = date(today.year, today.month, 1)
        end_date = today

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Total revenue
    total_revenue = Payment.objects.filter(
        payment_date__range=[start_datetime, end_datetime],
        status='COMPLETED'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

    # Revenue by payment method
    revenue_by_method = Payment.objects.filter(
        payment_date__range=[start_datetime, end_datetime],
        status='COMPLETED'
    ).values('payment_method').annotate(
        total=Sum('amount'),
        count=Count('id')
    ).order_by('-total')

    # Revenue by type (based on reservation or additional services)
    room_revenue = Payment.objects.filter(
        payment_date__range=[start_datetime, end_datetime],
        status='COMPLETED',
        reservation__isnull=False
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

    other_revenue = total_revenue - room_revenue

    # Daily revenue trend
    daily_revenue = []
    current_date = start_date
    while current_date <= end_date:
        day_start = datetime.combine(current_date, datetime.min.time())
        day_end = datetime.combine(current_date, datetime.max.time())

        day_total = Payment.objects.filter(
            payment_date__range=[day_start, day_end],
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        daily_revenue.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'revenue': float(day_total)
        })

        current_date += timedelta(days=1)

    return Response({
        'period': period,
        'total_revenue': float(total_revenue),
        'room_revenue': float(room_revenue),
        'other_revenue': float(other_revenue),
        'revenue_by_method': [
            {
                'method': item['payment_method'],
                'total': float(item['total']),
                'count': item['count']
            }
            for item in revenue_by_method
        ],
        'daily_revenue': daily_revenue
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def guest_analytics_report(request):
    """Generate guest analytics report"""
    period = request.GET.get('period', 'thisMonth')

    # Calculate date range
    today = date.today()
    if period == 'thisMonth':
        start_date = date(today.year, today.month, 1)
        end_date = today
    elif period == 'lastMonth':
        last_month = today.replace(day=1) - timedelta(days=1)
        start_date = date(last_month.year, last_month.month, 1)
        end_date = date(last_month.year, last_month.month, 1) + timedelta(days=32)
        end_date = end_date.replace(day=1) - timedelta(days=1)
    else:
        start_date = date(today.year, today.month, 1)
        end_date = today

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Total unique guests
    total_guests = Guest.objects.filter(
        created_at__range=[start_datetime, end_datetime]
    ).count()

    # Repeat guests (guests with multiple reservations)
    repeat_guests = Guest.objects.filter(
        created_at__lte=end_datetime
    ).annotate(
        reservation_count=Count('reservations')
    ).filter(reservation_count__gt=1).count()

    # Guest nationality breakdown
    nationality_breakdown = Guest.objects.filter(
        created_at__range=[start_datetime, end_datetime]
    ).values('nationality').annotate(
        count=Count('id')
    ).order_by('-count')[:10]

    # Booking patterns (by day of week)
    reservations = Reservation.objects.filter(
        created_at__range=[start_datetime, end_datetime]
    )

    booking_by_day = {}
    for res in reservations:
        day_name = res.created_at.strftime('%A')
        booking_by_day[day_name] = booking_by_day.get(day_name, 0) + 1

    # Average length of stay
    completed_reservations = Reservation.objects.filter(
        check_out_date__range=[start_datetime, end_datetime],
        status='CHECKED_OUT'
    )

    if completed_reservations.exists():
        total_nights = sum(
            (res.check_out_date - res.check_in_date).days
            for res in completed_reservations
        )
        avg_stay = round(total_nights / completed_reservations.count(), 1)
    else:
        avg_stay = 0

    return Response({
        'period': period,
        'total_guests': total_guests,
        'repeat_guests': repeat_guests,
        'repeat_rate': round((repeat_guests / total_guests * 100), 1) if total_guests > 0 else 0,
        'average_stay': avg_stay,
        'nationality_breakdown': [
            {
                'nationality': item['nationality'],
                'count': item['count'],
                'percentage': round((item['count'] / total_guests * 100), 1) if total_guests > 0 else 0
            }
            for item in nationality_breakdown
        ],
        'booking_by_day': booking_by_day
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def staff_performance_report(request):
    """Generate staff performance report based on maintenance technicians"""
    period = request.GET.get('period', 'thisMonth')

    # Calculate date range
    today = date.today()
    if period == 'thisMonth':
        start_date = date(today.year, today.month, 1)
        end_date = today
    elif period == 'lastMonth':
        last_month = today.replace(day=1) - timedelta(days=1)
        start_date = date(last_month.year, last_month.month, 1)
        end_date = date(last_month.year, last_month.month, 1) + timedelta(days=32)
        end_date = end_date.replace(day=1) - timedelta(days=1)
    else:
        start_date = date(today.year, today.month, 1)
        end_date = today

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Get maintenance technicians as staff proxy
    technicians = MaintenanceTechnician.objects.filter(is_active=True)

    staff_data = []
    for tech in technicians:
        # Get completed requests for this period
        completed_requests = MaintenanceRequest.objects.filter(
            assigned_technician=tech.name,
            status='COMPLETED',
            completed_date__range=[start_datetime, end_datetime]
        )

        requests_count = completed_requests.count()

        # Calculate average resolution time
        if requests_count > 0:
            total_hours = sum(
                req.resolution_time_hours for req in completed_requests
                if req.resolution_time_hours
            )
            avg_time = round(total_hours / requests_count, 1) if requests_count > 0 else 0
        else:
            avg_time = 0

        staff_data.append({
            'id': tech.id,
            'name': tech.name,
            'specialization': tech.specialization,
            'phone': tech.contact_number,
            'requests_completed': requests_count,
            'average_time': avg_time,
            'is_active': tech.is_active
        })

    return Response({
        'period': period,
        'total_staff': len(staff_data),
        'staff': staff_data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def satisfaction_report(request):
    """Generate guest satisfaction report based on complaints"""
    period = request.GET.get('period', 'thisMonth')

    # Calculate date range
    today = date.today()
    if period == 'thisMonth':
        start_date = date(today.year, today.month, 1)
        end_date = today
    elif period == 'lastMonth':
        last_month = today.replace(day=1) - timedelta(days=1)
        start_date = date(last_month.year, last_month.month, 1)
        end_date = date(last_month.year, last_month.month, 1) + timedelta(days=32)
        end_date = end_date.replace(day=1) - timedelta(days=1)
    else:
        start_date = date(today.year, today.month, 1)
        end_date = today

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Total complaints
    complaints = Complaint.objects.filter(
        created_at__range=[start_datetime, end_datetime]
    )

    total_complaints = complaints.count()
    resolved_complaints = complaints.filter(status='RESOLVED').count()
    pending_complaints = complaints.filter(status__in=['OPEN', 'IN_PROGRESS']).count()

    # Complaints by category
    complaints_by_category = complaints.values('category').annotate(
        count=Count('id')
    ).order_by('-count')

    # Resolution rate
    resolution_rate = round((resolved_complaints / total_complaints * 100), 1) if total_complaints > 0 else 100

    # Calculate satisfaction score (inverse of complaint rate)
    total_reservations = Reservation.objects.filter(
        created_at__range=[start_datetime, end_datetime]
    ).count()

    if total_reservations > 0:
        complaint_rate = total_complaints / total_reservations
        satisfaction_score = max(3.5, min(5.0, 5.0 - (complaint_rate * 10)))
    else:
        satisfaction_score = 4.5

    return Response({
        'period': period,
        'total_complaints': total_complaints,
        'resolved_complaints': resolved_complaints,
        'pending_complaints': pending_complaints,
        'resolution_rate': resolution_rate,
        'satisfaction_score': round(satisfaction_score, 1),
        'complaints_by_category': [
            {
                'category': item['category'],
                'count': item['count'],
                'percentage': round((item['count'] / total_complaints * 100), 1) if total_complaints > 0 else 0
            }
            for item in complaints_by_category
        ]
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def inventory_report(request):
    """Generate inventory report"""

    # Get all inventory items
    items = InventoryItem.objects.all()

    total_items = items.count()

    # Low stock items (current_stock <= minimum_stock OR current_stock <= 10 if no minimum_stock)
    from django.db.models import F
    low_stock_items = items.filter(
        Q(current_stock__lte=F('minimum_stock')) |
        Q(minimum_stock__isnull=True, current_stock__lte=10)
    ).count()

    out_of_stock = items.filter(current_stock=0).count()

    # Total inventory value
    total_value = sum(
        float(item.current_stock * item.unit_price)
        for item in items
    )

    # Items by category (category is ForeignKey, so get category name)
    items_by_category = items.values('category__name').annotate(
        count=Count('id'),
        total_quantity=Sum('current_stock')
    ).order_by('-count')

    return Response({
        'total_items': total_items,
        'low_stock_items': low_stock_items,
        'out_of_stock': out_of_stock,
        'total_value': total_value,
        'items_by_category': [
            {
                'category': item['category__name'] or 'Uncategorized',
                'count': item['count'],
                'total_quantity': item['total_quantity'] or 0
            }
            for item in items_by_category
        ]
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def maintenance_report(request):
    """Generate maintenance report"""
    period = request.GET.get('period', 'thisMonth')

    # Calculate date range
    today = date.today()
    if period == 'thisMonth':
        start_date = date(today.year, today.month, 1)
        end_date = today
    elif period == 'lastMonth':
        last_month = today.replace(day=1) - timedelta(days=1)
        start_date = date(last_month.year, last_month.month, 1)
        end_date = date(last_month.year, last_month.month, 1) + timedelta(days=32)
        end_date = end_date.replace(day=1) - timedelta(days=1)
    else:
        start_date = date(today.year, today.month, 1)
        end_date = today

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Get maintenance requests for the period
    requests = MaintenanceRequest.objects.filter(
        requested_date__range=[start_datetime, end_datetime]
    )

    total_requests = requests.count()
    completed = requests.filter(status='COMPLETED').count()
    in_progress = requests.filter(status='IN_PROGRESS').count()
    pending = requests.filter(status__in=['SUBMITTED', 'ACKNOWLEDGED']).count()

    # Calculate costs
    total_cost = requests.aggregate(
        total=Sum('actual_cost')
    )['total'] or Decimal('0')

    # By priority
    by_priority = requests.values('priority').annotate(
        count=Count('id')
    ).order_by('-count')

    # By category
    by_category = requests.values('category').annotate(
        count=Count('id')
    ).order_by('-count')

    # Average resolution time
    completed_requests = requests.filter(
        status='COMPLETED',
        completed_date__isnull=False
    )

    if completed_requests.exists():
        total_hours = sum(
            req.resolution_time_hours for req in completed_requests
            if req.resolution_time_hours
        )
        avg_resolution_time = round(total_hours / completed_requests.count(), 1) if completed_requests.count() > 0 else 0
    else:
        avg_resolution_time = 0

    return Response({
        'period': period,
        'total_requests': total_requests,
        'completed': completed,
        'in_progress': in_progress,
        'pending': pending,
        'total_cost': float(total_cost),
        'average_resolution_time': avg_resolution_time,
        'by_priority': [
            {
                'priority': item['priority'],
                'count': item['count']
            }
            for item in by_priority
        ],
        'by_category': [
            {
                'category': item['category'],
                'count': item['count']
            }
            for item in by_category
        ]
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def tax_report(request):
    """Generate tax report"""
    period = request.GET.get('period', 'thisMonth')

    # Calculate date range
    today = date.today()
    if period == 'thisMonth':
        start_date = date(today.year, today.month, 1)
        end_date = today
    elif period == 'lastMonth':
        last_month = today.replace(day=1) - timedelta(days=1)
        start_date = date(last_month.year, last_month.month, 1)
        end_date = date(last_month.year, last_month.month, 1) + timedelta(days=32)
        end_date = end_date.replace(day=1) - timedelta(days=1)
    else:
        start_date = date(today.year, today.month, 1)
        end_date = today

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())

    # Total revenue
    total_revenue = Payment.objects.filter(
        payment_date__range=[start_datetime, end_datetime],
        status='COMPLETED'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

    # Calculate taxes (10% PPN)
    vat_rate = Decimal('0.10')
    vat_amount = total_revenue * vat_rate

    # Hotel tax (typically 10% in Indonesia)
    hotel_tax_rate = Decimal('0.10')
    hotel_tax = total_revenue * hotel_tax_rate

    total_tax = vat_amount + hotel_tax

    return Response({
        'period': period,
        'total_revenue': float(total_revenue),
        'vat_rate': float(vat_rate * 100),
        'vat_amount': float(vat_amount),
        'hotel_tax_rate': float(hotel_tax_rate * 100),
        'hotel_tax': float(hotel_tax),
        'total_tax': float(total_tax)
    })