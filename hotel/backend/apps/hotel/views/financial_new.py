from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from ..models import (
    Room, Guest, Reservation, FinancialTransaction, Invoice, InvoiceItem
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

        # Get revenue data (current period)
        revenue_transactions = FinancialTransaction.objects.filter(
            transaction_type='revenue',
            transaction_date__gte=start_date,
            transaction_date__lte=end_date,
            status='completed'
        )

        total_revenue = revenue_transactions.aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')

        # Get revenue from last period for growth calculation
        last_revenue = FinancialTransaction.objects.filter(
            transaction_type='revenue',
            transaction_date__gte=last_start,
            transaction_date__lte=last_end,
            status='completed'
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

        # Get expense data by category
        expense_transactions = FinancialTransaction.objects.filter(
            transaction_type='expense',
            transaction_date__gte=start_date,
            transaction_date__lte=end_date,
            status='completed'
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
        for cat in expense_by_category:
            if total_expenses > 0:
                percentage = float(cat['amount']) / float(total_expenses) * 100
            else:
                percentage = 0.0

            # Format category name
            category_name = cat['category'].replace('_', ' ').title()

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

        # Build query
        transactions = FinancialTransaction.objects.filter(
            transaction_date__gte=start_date,
            transaction_date__lte=end_date
        ).select_related('guest', 'reservation', 'processed_by')

        # Apply filters
        if status_filter != 'all':
            transactions = transactions.filter(status=status_filter)

        if type_filter != 'all':
            transactions = transactions.filter(transaction_type=type_filter)

        if search:
            transactions = transactions.filter(
                Q(description__icontains=search) |
                Q(transaction_id__icontains=search) |
                Q(guest__first_name__icontains=search) |
                Q(guest__last_name__icontains=search)
            )

        # Order by date desc
        transactions = transactions.order_by('-transaction_date', '-transaction_time')

        # Format response to match frontend expectations
        transactions_list = []
        for txn in transactions:
            transactions_list.append({
                'id': txn.transaction_id,
                'date': txn.transaction_date.isoformat(),
                'time': txn.transaction_time.strftime('%H:%M'),
                'description': txn.description,
                'guest': txn.guest.full_name if txn.guest else None,
                'type': txn.transaction_type,
                'category': txn.category.replace('_', ' ').title(),
                'amount': float(txn.amount),
                'paymentMethod': txn.get_payment_method_display(),
                'status': txn.status,
                'reference': txn.reference_number or '-'
            })

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
