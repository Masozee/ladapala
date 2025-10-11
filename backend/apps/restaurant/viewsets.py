from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Sum, Count, Q, F
from datetime import datetime, timedelta
from .models import (
    Restaurant, Branch, Staff, 
    Category, Product, Inventory, InventoryTransaction,
    Order, OrderItem, Payment, Table,
    KitchenOrder, KitchenOrderItem,
    Promotion, Schedule, Report
)
from .serializers import (
    RestaurantSerializer, BranchSerializer, StaffSerializer,
    CategorySerializer, ProductSerializer, InventorySerializer,
    InventoryTransactionSerializer, OrderSerializer, OrderCreateSerializer,
    OrderItemSerializer, PaymentSerializer, TableSerializer,
    KitchenOrderSerializer, KitchenOrderItemSerializer,
    PromotionSerializer, ScheduleSerializer, ReportSerializer,
    DashboardSerializer
)
from .permissions import IsManagerOrAdmin, IsKitchenStaff, IsWarehouseStaff


class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'address']
    filterset_fields = ['is_active']


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'address']
    filterset_fields = ['restaurant', 'is_active']


class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'employee_id']
    filterset_fields = ['branch', 'role', 'is_active']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManagerOrAdmin()]
        return [IsAuthenticated()]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]  # Allow public access for frontend
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    filterset_fields = ['restaurant', 'is_active']
    ordering_fields = ['display_order', 'name']
    ordering = ['display_order']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  # Allow public access for frontend
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'sku']
    filterset_fields = ['restaurant', 'category', 'is_available']
    ordering_fields = ['name', 'price', 'created_at']

    @action(detail=False, methods=['get'])
    def available(self, request):
        available_products = self.get_queryset().filter(is_available=True)
        serializer = self.get_serializer(available_products, many=True)
        return Response(serializer.data)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'supplier']
    filterset_fields = ['branch']
    ordering_fields = ['name', 'quantity']
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        low_stock_items = self.get_queryset().filter(
            quantity__lte=F('min_quantity')
        )
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsWarehouseStaff()]
        return [IsAuthenticated()]


class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['inventory', 'transaction_type']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        transaction = serializer.save(performed_by=self.request.user)
        
        inventory = transaction.inventory
        if transaction.transaction_type == 'IN':
            inventory.quantity += transaction.quantity
        elif transaction.transaction_type in ['OUT', 'WASTE']:
            inventory.quantity -= transaction.quantity
        elif transaction.transaction_type == 'ADJUST':
            inventory.quantity = transaction.quantity
        
        inventory.save()


class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [AllowAny]  # Allow public access for frontend
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['branch', 'is_available']

    @action(detail=True, methods=['post'])
    def set_available(self, request, pk=None):
        table = self.get_object()
        table.is_available = True
        table.save()
        return Response({'status': 'table set as available'})

    @action(detail=True, methods=['post'])
    def set_occupied(self, request, pk=None):
        table = self.get_object()
        table.is_available = False
        table.save()
        return Response({'status': 'table set as occupied'})

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'set_available', 'set_occupied']:
            return [IsAuthenticated()]
        return [AllowAny()]


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    permission_classes = [AllowAny]  # Allow public access for frontend
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch', 'order_type', 'status', 'table']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer
    
    def perform_create(self, serializer):
        order = serializer.save()
        
        if order.order_type == 'DINE_IN' and order.table:
            order.table.is_available = False
            order.table.save()
        
        KitchenOrder.objects.create(order=order)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(Order.ORDER_STATUS):
            order.status = new_status
            order.save()
            
            if new_status == 'COMPLETED' and order.table:
                order.table.is_available = True
                order.table.save()
            
            return Response({'status': f'order status updated to {new_status}'})
        
        return Response(
            {'error': 'Invalid status'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        order = self.get_object()
        serializer = OrderItemSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(order=order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        orders = self.get_queryset().filter(created_at__date=today)
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['order', 'payment_method', 'status']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        payment = serializer.save(processed_by=self.request.user.staff)
        
        if payment.status == 'COMPLETED':
            order = payment.order
            order.status = 'COMPLETED'
            order.save()


class KitchenOrderViewSet(viewsets.ModelViewSet):
    queryset = KitchenOrder.objects.all()
    serializer_class = KitchenOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'assigned_to']
    ordering = ['-priority', 'created_at']
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        kitchen_order = self.get_object()
        staff_id = request.data.get('staff_id')
        
        try:
            staff = Staff.objects.get(id=staff_id, role='KITCHEN')
            kitchen_order.assigned_to = staff
            kitchen_order.save()
            return Response({'status': 'order assigned'})
        except Staff.DoesNotExist:
            return Response(
                {'error': 'Kitchen staff not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def start_preparation(self, request, pk=None):
        kitchen_order = self.get_object()
        kitchen_order.status = 'PREPARING'
        kitchen_order.started_at = timezone.now()
        kitchen_order.save()
        
        kitchen_order.order.status = 'PREPARING'
        kitchen_order.order.save()
        
        return Response({'status': 'preparation started'})
    
    @action(detail=True, methods=['post'])
    def mark_ready(self, request, pk=None):
        kitchen_order = self.get_object()
        kitchen_order.status = 'READY'
        kitchen_order.completed_at = timezone.now()
        kitchen_order.save()
        
        kitchen_order.order.status = 'READY'
        kitchen_order.order.save()
        
        return Response({'status': 'order marked as ready'})
    
    @action(detail=True, methods=['get'])
    def print_ticket(self, request, pk=None):
        """Generate and return kitchen ticket for printing"""
        from .services.kitchen_printer import KitchenTicketPrinter
        
        kitchen_order = self.get_object()
        printer = KitchenTicketPrinter()
        
        # Format order data
        order_data = {
            'order_number': kitchen_order.order.order_number,
            'order_type': kitchen_order.order.order_type,
            'table_number': kitchen_order.order.table.number if kitchen_order.order.table else None,
            'priority': kitchen_order.priority,
            'created_at': kitchen_order.created_at,
            'estimated_prep_time': self._calculate_prep_time(kitchen_order.order),
            'notes': kitchen_order.order.notes,
            'customer_name': kitchen_order.order.customer_name,
            'customer_phone': kitchen_order.order.customer_phone,
            'delivery_address': kitchen_order.order.delivery_address,
            'created_by': kitchen_order.order.created_by.user.get_full_name() if kitchen_order.order.created_by else 'System'
        }
        
        # Format items
        items = []
        for item in kitchen_order.order.items.all():
            items.append({
                'quantity': item.quantity,
                'product_name': item.product.name,
                'notes': item.notes,
                'modifiers': []
            })
        
        ticket = printer.print_ticket(order_data, items)
        
        return Response({
            'ticket': ticket,
            'order_number': kitchen_order.order.order_number,
            'status': 'ticket generated'
        })
    
    @action(detail=False, methods=['get'])
    def queue_summary(self, request):
        """Get kitchen queue summary"""
        from .services.kitchen_printer import KitchenTicketPrinter
        
        branch_id = request.query_params.get('branch_id')
        if not branch_id:
            return Response({'error': 'branch_id required'}, status=400)
        
        # Get pending orders for the branch
        orders = self.get_queryset().filter(
            order__branch_id=branch_id,
            status__in=['PENDING', 'PREPARING']
        ).order_by('-priority', 'created_at')
        
        order_data_list = []
        for ko in orders:
            order_data_list.append({
                'order_number': ko.order.order_number,
                'order_type': ko.order.order_type,
                'table_number': ko.order.table.number if ko.order.table else None,
                'priority': ko.priority,
                'created_at': ko.created_at,
                'status': ko.status
            })
        
        printer = KitchenTicketPrinter()
        summary = printer.print_summary_ticket(order_data_list)
        
        return Response({
            'summary': summary,
            'total_orders': len(order_data_list)
        })
    
    def _calculate_prep_time(self, order):
        """Calculate estimated preparation time"""
        max_prep_time = 15
        for item in order.items.all():
            if item.product.preparation_time > max_prep_time:
                max_prep_time = item.product.preparation_time
        return max_prep_time
    
    def get_permissions(self):
        if self.action in ['assign', 'start_preparation', 'mark_ready']:
            return [IsKitchenStaff()]
        return [IsAuthenticated()]


class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'promo_code', 'description']
    filterset_fields = ['restaurant', 'discount_type', 'promo_type', 'is_active']
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        now = timezone.now()
        active_promos = self.get_queryset().filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        )
        serializer = self.get_serializer(active_promos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def validate_code(self, request):
        promo_code = request.data.get('promo_code')
        
        try:
            promotion = Promotion.objects.get(promo_code=promo_code)
            if promotion.is_valid():
                serializer = self.get_serializer(promotion)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Promotion is not valid'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Promotion.DoesNotExist:
            return Response(
                {'error': 'Invalid promo code'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManagerOrAdmin()]
        return [IsAuthenticated()]


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['staff', 'date', 'shift_type', 'is_confirmed']
    ordering = ['date', 'start_time']
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        schedules = self.get_queryset().filter(date=today)
        serializer = self.get_serializer(schedules, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def week(self, request):
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        schedules = self.get_queryset().filter(
            date__gte=week_start,
            date__lte=week_end
        )
        serializer = self.get_serializer(schedules, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        schedule = self.get_object()
        schedule.is_confirmed = True
        schedule.save()
        return Response({'status': 'schedule confirmed'})
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'confirm']:
            return [IsManagerOrAdmin()]
        return [IsAuthenticated()]


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch', 'report_type']
    ordering = ['-created_at']
    
    @action(detail=False, methods=['post'])
    def generate_daily(self, request):
        branch_id = request.data.get('branch_id')
        date = request.data.get('date', timezone.now().date())
        
        if isinstance(date, str):
            date = datetime.strptime(date, '%Y-%m-%d').date()
        
        try:
            branch = Branch.objects.get(id=branch_id)
        except Branch.DoesNotExist:
            return Response(
                {'error': 'Branch not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        orders = Order.objects.filter(
            branch=branch,
            created_at__date=date
        )
        
        total_orders = orders.count()
        total_revenue = orders.filter(
            status='COMPLETED'
        ).aggregate(total=Sum('payments__amount'))['total'] or 0
        
        orders_by_type = orders.values('order_type').annotate(count=Count('id'))
        orders_by_status = orders.values('status').annotate(count=Count('id'))
        
        top_products = OrderItem.objects.filter(
            order__branch=branch,
            order__created_at__date=date
        ).values('product__name').annotate(
            quantity_sold=Sum('quantity')
        ).order_by('-quantity_sold')[:10]
        
        report_data = {
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'orders_by_type': list(orders_by_type),
            'orders_by_status': list(orders_by_status),
            'top_products': list(top_products)
        }
        
        report = Report.objects.create(
            branch=branch,
            report_type='DAILY',
            start_date=date,
            end_date=date,
            data=report_data,
            generated_by=self.request.user.staff if hasattr(self.request.user, 'staff') else None
        )
        
        serializer = self.get_serializer(report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def get_permissions(self):
        if self.action == 'generate_daily':
            return [IsManagerOrAdmin()]
        return [IsAuthenticated()]


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        branch_id = request.query_params.get('branch_id')
        
        if not branch_id:
            return Response(
                {'error': 'branch_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            branch = Branch.objects.get(id=branch_id)
        except Branch.DoesNotExist:
            return Response(
                {'error': 'Branch not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        today = timezone.now().date()
        
        orders_today = Order.objects.filter(
            branch=branch,
            created_at__date=today
        )
        
        total_orders_today = orders_today.count()
        
        total_revenue_today = orders_today.filter(
            status='COMPLETED'
        ).aggregate(total=Sum('payments__amount'))['total'] or 0
        
        pending_orders = orders_today.filter(
            status__in=['PENDING', 'CONFIRMED', 'PREPARING']
        ).count()
        
        low_stock_items = Inventory.objects.filter(
            branch=branch,
            quantity__lte=F('min_quantity')
        ).count()
        
        active_tables = Table.objects.filter(
            branch=branch,
            is_available=False
        ).count()
        
        staff_on_duty = Schedule.objects.filter(
            staff__branch=branch,
            date=today,
            is_confirmed=True
        ).count()
        
        data = {
            'total_orders_today': total_orders_today,
            'total_revenue_today': total_revenue_today,
            'pending_orders': pending_orders,
            'low_stock_items': low_stock_items,
            'active_tables': active_tables,
            'staff_on_duty': staff_on_duty
        }
        
        serializer = DashboardSerializer(data)
        return Response(serializer.data)