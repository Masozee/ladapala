from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from ..models import (
    Room, Guest, Reservation, FinancialTransaction, Invoice, InvoiceItem,
    Payment, Expense
)
from ..serializers import (
    FinancialTransactionSerializer, InvoiceSerializer, InvoiceItemSerializer
)


class FinancialViewSet(viewsets.ViewSet):
    """
    ViewSet for financial data and analytics
    Provides overview, transactions, and reporting endpoints
    """

    @action(detail=False, methods=['get'], url_path='overview')
    def financial_overview(self, request):
        """
        GET /api/hotel/financial/overview/

        Query params:
        - period: 'thisMonth', 'lastMonth', 'thisYear', 'custom'
        - start_date: YYYY-MM-DD (for custom period)
        - end_date: YYYY-MM-DD (for custom period)

        Returns financial overview including revenue, expenses, and profit data
        """
        period = request.query_params.get('period', 'thisMonth')

        # Calculate date range based on period
        today = timezone.now().date()

        if period == 'thisMonth':
            start_date = today.replace(day=1)
            end_date = today
            last_start = (start_date - timedelta(days=1)).replace(day=1)
            last_end = start_date - timedelta(days=1)
        elif period == 'lastMonth':
            end_date = (today.replace(day=1) - timedelta(days=1))
            start_date = end_date.replace(day=1)
            last_start = (start_date - timedelta(days=1)).replace(day=1)
            last_end = start_date - timedelta(days=1)
        elif period == 'thisYear':
            start_date = today.replace(month=1, day=1)
            end_date = today
            last_start = start_date.replace(year=start_date.year - 1)
            last_end = end_date.replace(year=end_date.year - 1)
        elif period == 'custom':
            start_date_str = request.query_params.get('start_date')
            end_date_str = request.query_params.get('end_date')

            if not start_date_str or not end_date_str:
                return Response(
                    {'error': 'start_date and end_date required for custom period'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()

            # Calculate previous period of same length
            period_length = (end_date - start_date).days
            last_end = start_date - timedelta(days=1)
            last_start = last_end - timedelta(days=period_length)
        else:
            return Response(
                {'error': 'Invalid period parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get revenue data from Payment model (current period)
        total_revenue = Payment.objects.filter(
            payment_date__date__gte=start_date,
            payment_date__date__lte=end_date,
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Get revenue from last period for growth calculation
        last_revenue = Payment.objects.filter(
            payment_date__date__gte=last_start,
            payment_date__date__lte=last_end,
            status='COMPLETED'
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Calculate growth percentage
        if last_revenue > 0:
            growth = float((total_revenue - last_revenue) / last_revenue * 100)
        else:
            growth = 0.0 if total_revenue == 0 else 100.0

        # Calculate daily average
        days_in_period = (end_date - start_date).days + 1
        daily_average = float(total_revenue) / days_in_period if days_in_period > 0 else 0.0

        revenue_data = {
            'total': float(total_revenue),
            'thisMonth': float(total_revenue),
            'lastMonth': float(last_revenue),
            'growth': round(growth, 2),
            'dailyAverage': round(daily_average, 2)
        }

        # Get expense data from Expense model by category
        expense_transactions = Expense.objects.filter(
            expense_date__date__gte=start_date,
            expense_date__date__lte=end_date,
            status='PAID'
        )

        total_expenses = expense_transactions.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        # Group expenses by category
        expense_by_category = expense_transactions.values('category').annotate(
            amount=Sum('amount')
        ).order_by('-amount')

        # Calculate percentages
        expense_categories = []
        # Get category display names from Expense model CATEGORY_CHOICES
        category_choices = dict(Expense.CATEGORY_CHOICES)
        for cat in expense_by_category:
            if total_expenses > 0:
                percentage = float(cat['amount']) / float(total_expenses) * 100
            else:
                percentage = 0.0

            # Get proper category name from choices
            category_name = category_choices.get(cat['category'], cat['category'])

            expense_categories.append({
                'name': category_name,
                'amount': float(cat['amount']),
                'percentage': round(percentage, 1)
            })

        expense_data = {
            'total': float(total_expenses),
            'categories': expense_categories
        }

        # Calculate profit
        profit_total = total_revenue - total_expenses
        profit_margin = (float(profit_total) / float(total_revenue) * 100) if total_revenue > 0 else 0.0

        profit_data = {
            'total': float(profit_total),
            'margin': round(profit_margin, 2)
        }

        return Response({
            'revenue': revenue_data,
            'expenses': expense_data,
            'profit': profit_data
        })

    @action(detail=False, methods=['get'], url_path='transactions')
    def transactions_list(self, request):
        """
        GET /api/hotel/financial/transactions/

        Query params:
        - period: 'thisMonth', 'lastMonth', 'thisYear', 'custom'
        - status: 'all', 'completed', 'pending', 'failed'
        - search: search term for description, guest name, transaction ID
        - type: 'all', 'revenue', 'expense'

        Returns list of transactions
        """
        period = request.query_params.get('period', 'thisMonth')
        status_filter = request.query_params.get('status', 'all')
        search = request.query_params.get('search', '')
        type_filter = request.query_params.get('type', 'all')

        # Calculate date range
        today = timezone.now().date()

        if period == 'thisMonth':
            start_date = today.replace(day=1)
            end_date = today
        elif period == 'lastMonth':
            end_date = (today.replace(day=1) - timedelta(days=1))
            start_date = end_date.replace(day=1)
        elif period == 'thisYear':
            start_date = today.replace(month=1, day=1)
            end_date = today
        elif period == 'custom':
            start_date_str = request.query_params.get('start_date')
            end_date_str = request.query_params.get('end_date')

            if start_date_str and end_date_str:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            else:
                start_date = today.replace(day=1)
                end_date = today
        else:
            start_date = today.replace(day=1)
            end_date = today

        # Get payments (revenue) from Payment model
        transactions_list = []

        payments = Payment.objects.filter(
            payment_date__date__gte=start_date,
            payment_date__date__lte=end_date
        ).select_related('reservation', 'reservation__guest')

        # Filter payments by status
        if status_filter != 'all':
            status_map = {
                'completed': 'COMPLETED',
                'pending': 'PENDING',
                'cancelled': 'CANCELLED'
            }
            if status_filter in status_map:
                payments = payments.filter(status=status_map[status_filter])

        # Add payments to list if type filter allows
        if type_filter in ['all', 'revenue']:
            for payment in payments:
                guest_name = payment.reservation.guest.full_name if payment.reservation and payment.reservation.guest else 'Walk-in'

                # Apply search filter
                if search and search.lower() not in guest_name.lower() and (not payment.transaction_id or search.lower() not in payment.transaction_id.lower()):
                    continue

                transactions_list.append({
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

        # Get expenses from Expense model
        if type_filter in ['all', 'expense']:
            expenses = Expense.objects.filter(
                expense_date__date__gte=start_date,
                expense_date__date__lte=end_date
            )

            # Filter expenses by status
            if status_filter != 'all':
                status_map = {
                    'completed': 'PAID',
                    'pending': 'PENDING',
                    'cancelled': 'CANCELLED'
                }
                if status_filter in status_map:
                    expenses = expenses.filter(status=status_map[status_filter])

            for expense in expenses:
                # Apply search filter
                if search and search.lower() not in expense.description.lower():
                    continue

                transactions_list.append({
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
        transactions_list.sort(key=lambda x: (x['date'], x['time']), reverse=True)

        return Response({
            'transactions': transactions_list,
            'count': len(transactions_list)
        })


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for invoice management
    """
    queryset = Invoice.objects.all().select_related(
        'guest', 'reservation', 'created_by'
    ).prefetch_related('items')
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        """
        Filter invoices based on query parameters
        """
        queryset = super().get_queryset()

        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filter by guest
        guest_id = self.request.query_params.get('guest_id')
        if guest_id:
            queryset = queryset.filter(guest_id=guest_id)

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            queryset = queryset.filter(issue_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(issue_date__lte=end_date)

        return queryset.order_by('-issue_date')

    def perform_create(self, serializer):
        """
        Auto-set created_by to current user
        """
        serializer.save(created_by=self.request.user)


class FinancialTransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for transaction CRUD operations
    """
    queryset = FinancialTransaction.objects.all().select_related(
        'guest', 'reservation', 'processed_by'
    )
    serializer_class = FinancialTransactionSerializer

    def get_queryset(self):
        """
        Filter transactions based on query parameters
        """
        queryset = super().get_queryset()

        # Filter by type
        txn_type = self.request.query_params.get('type')
        if txn_type:
            queryset = queryset.filter(transaction_type=txn_type)

        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)

        return queryset.order_by('-transaction_date', '-transaction_time')

    def perform_create(self, serializer):
        """
        Auto-set processed_by to current user and transaction date/time
        """
        now = timezone.now()
        serializer.save(
            processed_by=self.request.user,
            transaction_date=now.date(),
            transaction_time=now.time()
        )
