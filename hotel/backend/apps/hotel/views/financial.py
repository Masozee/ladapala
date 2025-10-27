from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.hotel.models import Payment, Expense, Reservation


@api_view(['GET'])
def financial_overview(request):
    """
    Financial overview API for the financial page
    Returns revenue, expenses, and profit data
    """
    # Get period filter (default: thisMonth)
    period = request.GET.get('period', 'thisMonth')

    # Calculate date range based on period
    today = timezone.now().date()
    if period == 'thisMonth':
        start_date = today.replace(day=1)
        end_date = today

        # Last month for comparison
        last_month_end = start_date - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
    elif period == 'lastMonth':
        last_day_prev_month = today.replace(day=1) - timedelta(days=1)
        start_date = last_day_prev_month.replace(day=1)
        end_date = last_day_prev_month

        # Month before last for comparison
        last_month_end = start_date - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
    elif period == 'thisYear':
        start_date = today.replace(month=1, day=1)
        end_date = today

        # Last year for comparison
        last_month_start = start_date.replace(year=start_date.year - 1)
        last_month_end = end_date.replace(year=end_date.year - 1)
    else:
        # Default to this month
        start_date = today.replace(day=1)
        end_date = today
        last_month_end = start_date - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)

    # Calculate revenue from completed payments
    current_revenue = Payment.objects.filter(
        payment_date__date__gte=start_date,
        payment_date__date__lte=end_date,
        status='COMPLETED'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

    last_revenue = Payment.objects.filter(
        payment_date__date__gte=last_month_start,
        payment_date__date__lte=last_month_end,
        status='COMPLETED'
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

    # Calculate growth percentage
    if last_revenue > 0:
        growth = float(((current_revenue - last_revenue) / last_revenue) * 100)
    else:
        growth = 0 if current_revenue == 0 else 100

    # Calculate daily average
    days_in_period = (end_date - start_date).days + 1
    daily_average = float(current_revenue) / days_in_period if days_in_period > 0 else 0

    # Calculate expenses by category
    expenses_by_category = Expense.objects.filter(
        expense_date__date__gte=start_date,
        expense_date__date__lte=end_date,
        status='PAID'
    ).values('category').annotate(
        total=Sum('amount')
    )

    total_expenses = sum(item['total'] for item in expenses_by_category)

    # Format expense categories
    expense_categories = []
    for item in expenses_by_category:
        percentage = (float(item['total']) / float(total_expenses) * 100) if total_expenses > 0 else 0
        expense_categories.append({
            'name': dict(Expense.CATEGORY_CHOICES).get(item['category'], item['category']),
            'amount': float(item['total']),
            'percentage': round(percentage, 1)
        })

    # Sort by amount descending
    expense_categories.sort(key=lambda x: x['amount'], reverse=True)

    # Calculate profit
    profit = float(current_revenue) - float(total_expenses)
    profit_margin = (profit / float(current_revenue) * 100) if current_revenue > 0 else 0

    return Response({
        'revenue': {
            'total': float(current_revenue),
            'thisMonth': float(current_revenue),
            'lastMonth': float(last_revenue),
            'growth': round(growth, 1),
            'dailyAverage': round(daily_average, 0)
        },
        'expenses': {
            'total': float(total_expenses),
            'categories': expense_categories
        },
        'profit': {
            'total': round(profit, 0),
            'margin': round(profit_margin, 1)
        }
    })


@api_view(['GET'])
def financial_transactions(request):
    """
    Get list of all financial transactions (payments and expenses)
    """
    # Get filters
    search = request.GET.get('search', '')
    payment_status = request.GET.get('status', 'all')
    period = request.GET.get('period', 'thisMonth')

    # Calculate date range
    today = timezone.now().date()
    if period == 'thisMonth':
        start_date = today.replace(day=1)
        end_date = today
    elif period == 'lastMonth':
        last_day_prev_month = today.replace(day=1) - timedelta(days=1)
        start_date = last_day_prev_month.replace(day=1)
        end_date = last_day_prev_month
    elif period == 'thisYear':
        start_date = today.replace(month=1, day=1)
        end_date = today
    else:
        start_date = today.replace(day=1)
        end_date = today

    transactions = []

    # Get payments (revenue)
    payments = Payment.objects.filter(
        payment_date__date__gte=start_date,
        payment_date__date__lte=end_date
    ).select_related('reservation', 'reservation__guest')

    # Filter by status
    if payment_status != 'all':
        status_map = {
            'completed': 'COMPLETED',
            'pending': 'PENDING',
            'cancelled': 'CANCELLED'
        }
        if payment_status in status_map:
            payments = payments.filter(status=status_map[payment_status])

    for payment in payments:
        guest_name = payment.reservation.guest.full_name if payment.reservation and payment.reservation.guest else 'Walk-in'

        # Apply search filter
        if search and search.lower() not in guest_name.lower() and search.lower() not in payment.transaction_id.lower() if payment.transaction_id else True:
            continue

        transactions.append({
            'id': f'PAY{payment.id}',
            'date': payment.payment_date.strftime('%Y-%m-%d'),
            'time': payment.payment_date.strftime('%H:%M'),
            'description': f'Room Payment - {payment.reservation.reservation_number}' if payment.reservation else 'Room Payment',
            'guest': guest_name,
            'type': 'revenue',
            'category': 'Kamar',
            'amount': float(payment.amount),
            'paymentMethod': dict(Payment.PAYMENT_METHOD_CHOICES).get(payment.payment_method, payment.payment_method),
            'status': payment.status.lower(),
            'reference': payment.reservation.reservation_number if payment.reservation else ''
        })

    # Get expenses
    expenses = Expense.objects.filter(
        expense_date__date__gte=start_date,
        expense_date__date__lte=end_date
    )

    # Filter by status for expenses
    if payment_status != 'all':
        status_map = {
            'completed': 'PAID',
            'pending': 'PENDING',
            'cancelled': 'CANCELLED'
        }
        if payment_status in status_map:
            expenses = expenses.filter(status=status_map[payment_status])

    for expense in expenses:
        # Apply search filter
        if search and search.lower() not in expense.description.lower():
            continue

        transactions.append({
            'id': f'EXP{expense.id}',
            'date': expense.expense_date.strftime('%Y-%m-%d'),
            'time': expense.expense_date.strftime('%H:%M'),
            'description': expense.description,
            'guest': None,
            'type': 'expense',
            'category': dict(Expense.CATEGORY_CHOICES).get(expense.category, expense.category),
            'amount': float(expense.amount),
            'paymentMethod': dict(Expense.PAYMENT_METHOD_CHOICES).get(expense.payment_method, expense.payment_method),
            'status': 'completed' if expense.status == 'PAID' else expense.status.lower(),
            'reference': expense.reference or ''
        })

    # Sort by date and time descending
    transactions.sort(key=lambda x: (x['date'], x['time']), reverse=True)

    return Response({
        'transactions': transactions,
        'count': len(transactions)
    })
