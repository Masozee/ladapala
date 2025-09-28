from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta, date
from decimal import Decimal

from ..models import MaintenanceRequest, MaintenanceTechnician


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