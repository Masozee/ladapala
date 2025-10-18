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
    Promotion, Schedule, Report, CashierSession,
    Recipe, RecipeIngredient
)
from .serializers import (
    RestaurantSerializer, BranchSerializer, StaffSerializer,
    CategorySerializer, ProductSerializer, InventorySerializer,
    InventoryTransactionSerializer, OrderSerializer, OrderCreateSerializer,
    OrderItemSerializer, PaymentSerializer, TableSerializer,
    KitchenOrderSerializer, KitchenOrderItemSerializer,
    PromotionSerializer, ScheduleSerializer, ReportSerializer,
    DashboardSerializer, CashierSessionSerializer, CashierSessionOpenSerializer,
    CashierSessionCloseSerializer, RecipeSerializer, RecipeIngredientSerializer
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

    @action(detail=False, methods=['get'])
    def check_stock_availability(self, request):
        """Check which products can be made based on current kitchen stock"""
        from .models import Recipe

        products = self.get_queryset().filter(is_available=True)
        product_availability = []

        for product in products:
            availability_info = {
                'id': product.id,
                'name': product.name,
                'price': product.price,
                'category': product.category.name if product.category else None,
                'image': product.image.url if product.image else None,
                'can_be_made': True,
                'insufficient_ingredients': []
            }

            try:
                recipe = product.recipe

                # Check each ingredient availability for 1 serving
                for recipe_ingredient in recipe.ingredients.all():
                    inventory_item = recipe_ingredient.inventory_item
                    quantity_needed = float(recipe_ingredient.quantity)

                    if inventory_item.quantity < quantity_needed:
                        availability_info['can_be_made'] = False
                        availability_info['insufficient_ingredients'].append({
                            'name': inventory_item.name,
                            'needed': quantity_needed,
                            'available': float(inventory_item.quantity),
                            'unit': inventory_item.unit
                        })

            except Recipe.DoesNotExist:
                # Product doesn't have a recipe - assume it can be made
                availability_info['can_be_made'] = True

            product_availability.append(availability_info)

        return Response(product_availability)

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

    @action(detail=False, methods=['get'])
    def unpaid(self, request):
        """Get unpaid orders (READY status)"""
        branch_id = request.query_params.get('branch_id')

        queryset = self.get_queryset().filter(status='READY')

        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)

        orders = queryset.order_by('-created_at')
        serializer = self.get_serializer(orders, many=True)

        # Calculate total amount
        total_amount = sum(order.total_amount for order in orders)

        return Response({
            'count': orders.count(),
            'total_amount': float(total_amount),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def processing(self, request):
        """Get processing orders (PREPARING/CONFIRMED status)"""
        branch_id = request.query_params.get('branch_id')

        queryset = self.get_queryset().filter(status__in=['PREPARING', 'CONFIRMED'])

        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)

        orders = queryset.order_by('-created_at')
        serializer = self.get_serializer(orders, many=True)

        return Response({
            'count': orders.count(),
            'results': serializer.data
        })


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

            # First, check if all ingredients are available in sufficient quantity
            insufficient_items = []
            for order_item in order.items.all():
                try:
                    recipe = order_item.product.recipe
                    quantity_ordered = order_item.quantity

                    # Check each ingredient availability
                    for recipe_ingredient in recipe.ingredients.all():
                        inventory_item = recipe_ingredient.inventory_item
                        total_quantity_needed = float(recipe_ingredient.quantity) * quantity_ordered

                        if inventory_item.quantity < total_quantity_needed:
                            insufficient_items.append({
                                'product': order_item.product.name,
                                'ingredient': inventory_item.name,
                                'needed': total_quantity_needed,
                                'available': float(inventory_item.quantity),
                                'unit': inventory_item.unit
                            })
                except Recipe.DoesNotExist:
                    # Product doesn't have a recipe, skip validation
                    pass

            # If any ingredient is insufficient, reject the payment
            if insufficient_items:
                from rest_framework.exceptions import ValidationError
                error_messages = []
                for item in insufficient_items:
                    error_messages.append(
                        f"{item['product']}: Stok {item['ingredient']} tidak cukup. "
                        f"Dibutuhkan {item['needed']}{item['unit']}, tersedia {item['available']}{item['unit']}"
                    )
                raise ValidationError({
                    'error': 'Stok bahan tidak mencukupi',
                    'details': error_messages
                })

            # All ingredients available, proceed with payment
            order.status = 'COMPLETED'
            order.save()

            # Deduct ingredients from kitchen inventory based on recipes
            for order_item in order.items.all():
                try:
                    recipe = order_item.product.recipe
                    quantity_ordered = order_item.quantity

                    # Deduct each ingredient from kitchen inventory
                    for recipe_ingredient in recipe.ingredients.all():
                        inventory_item = recipe_ingredient.inventory_item
                        total_quantity_needed = float(recipe_ingredient.quantity) * quantity_ordered

                        # Update inventory quantity
                        inventory_item.quantity -= total_quantity_needed
                        inventory_item.save()

                        # Create inventory transaction record (OUT)
                        InventoryTransaction.objects.create(
                            inventory=inventory_item,
                            transaction_type='OUT',
                            quantity=total_quantity_needed,
                            unit_cost=inventory_item.cost_per_unit,
                            reference_number=f"ORDER-{order.id}",
                            performed_by=self.request.user,
                            notes=f"Auto-deduction for {quantity_ordered}x {order_item.product.name} (Order #{order.id})"
                        )
                except Recipe.DoesNotExist:
                    # Product doesn't have a recipe, skip ingredient deduction
                    pass


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
    filterset_fields = {
        'staff': ['exact'],
        'date': ['exact', 'gte', 'lte'],
        'shift_type': ['exact'],
        'is_confirmed': ['exact']
    }
    ordering = ['date', 'start_time']
    pagination_class = None  # Disable pagination for schedules
    
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
        session_id = request.query_params.get('session_id')

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

        # If session_id provided, filter by session; otherwise show today's data
        if session_id:
            try:
                session = CashierSession.objects.get(id=session_id, branch=branch)

                # Count only PAID transactions in this session
                paid_orders_session = Payment.objects.filter(
                    cashier_session=session,
                    status='COMPLETED'
                ).values('order').distinct().count()

                total_orders_today = paid_orders_session

                # Calculate revenue from completed payments in this session
                total_revenue_today = Payment.objects.filter(
                    cashier_session=session,
                    status='COMPLETED'
                ).aggregate(total=Sum('amount'))['total'] or 0

                # For session-based, count orders created during session time
                orders_in_session = Order.objects.filter(
                    branch=branch,
                    created_at__gte=session.opened_at,
                    created_at__lte=session.closed_at if session.closed_at else timezone.now()
                )

            except CashierSession.DoesNotExist:
                return Response(
                    {'error': 'Session not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Original day-based logic
            orders_today = Order.objects.filter(
                branch=branch,
                created_at__date=today
            )

            orders_in_session = orders_today

            # Count only PAID transactions (orders with completed payments)
            # This represents actual completed sales, not just orders placed
            paid_orders_today = Payment.objects.filter(
                order__branch=branch,
                created_at__date=today,
                status='COMPLETED'
            ).values('order').distinct().count()

            total_orders_today = paid_orders_today

            # Calculate revenue from completed payments only (not order status)
            # This ensures we only count orders that have been paid
            total_revenue_today = Payment.objects.filter(
                order__branch=branch,
                created_at__date=today,
                status='COMPLETED'
            ).aggregate(total=Sum('amount'))['total'] or 0
        
        pending_orders = orders_in_session.filter(
            status__in=['PENDING', 'CONFIRMED', 'PREPARING']
        ).count()

        low_stock_items = Inventory.objects.filter(
            branch=branch,
            quantity__lte=F('min_quantity')
        ).count()

        # Active tables: count tables with unpaid orders from today/session
        if session_id:
            # For session-based: tables with orders created during session that haven't been paid
            active_tables_ids = Order.objects.filter(
                branch=branch,
                table__isnull=False,
                created_at__gte=session.opened_at,
                created_at__lte=session.closed_at if session.closed_at else timezone.now()
            ).exclude(
                payments__status='COMPLETED'
            ).values_list('table', flat=True).distinct()
            active_tables = len(active_tables_ids)
        else:
            # For day-based: tables with orders from today that haven't been paid
            active_tables_ids = Order.objects.filter(
                branch=branch,
                table__isnull=False,
                created_at__date=today
            ).exclude(
                payments__status='COMPLETED'
            ).values_list('table', flat=True).distinct()
            active_tables = len(active_tables_ids)
        
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


class CashierSessionViewSet(viewsets.ModelViewSet):
    queryset = CashierSession.objects.all()
    serializer_class = CashierSessionSerializer
    permission_classes = [AllowAny]  # Allow public access for frontend
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['cashier', 'branch', 'status', 'shift_type']
    ordering = ['-opened_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return CashierSessionOpenSerializer
        return CashierSessionSerializer

    def perform_create(self, serializer):
        """Validate schedule before creating session and create audit logs"""
        from .models import SessionAuditLog

        cashier = serializer.validated_data.get('cashier')
        shift_type = serializer.validated_data.get('shift_type')
        override_by_id = serializer.validated_data.pop('override_by', None)
        override_reason = serializer.validated_data.pop('override_reason', '')

        # Check if cashier has a schedule for today with matching shift
        today = timezone.now().date()
        schedule = Schedule.objects.filter(
            staff=cashier,
            date=today,
            shift_type=shift_type
        ).first()

        # Handle manager override
        override_staff = None
        if override_by_id:
            override_staff = Staff.objects.get(id=override_by_id)
            serializer.validated_data['override_by'] = override_staff
            serializer.validated_data['override_reason'] = override_reason

        # Create session
        session = serializer.save()

        # Create audit log for session opening
        SessionAuditLog.objects.create(
            session=session,
            event_type='SESSION_OPENED',
            performed_by=cashier,
            event_data={
                'shift_type': shift_type,
                'opening_cash': str(session.opening_cash),
                'has_schedule': schedule is not None,
                'schedule_confirmed': schedule.is_confirmed if schedule else False,
                'has_override': override_staff is not None
            }
        )

        # Log manager override if present
        if override_staff:
            SessionAuditLog.objects.create(
                session=session,
                event_type='OVERRIDE_APPLIED',
                performed_by=override_staff,
                notes=f'Manager override oleh {override_staff.user.get_full_name()}: {override_reason}',
                event_data={
                    'override_by_id': override_staff.id,
                    'override_by_name': override_staff.user.get_full_name(),
                    'override_by_role': override_staff.role,
                    'reason': override_reason
                }
            )

        # Log schedule warnings
        if not schedule:
            SessionAuditLog.objects.create(
                session=session,
                event_type='SCHEDULE_WARNING',
                performed_by=cashier,
                notes=f'Tidak ada jadwal terdaftar untuk shift {shift_type} pada {today}'
            )
        elif not schedule.is_confirmed:
            SessionAuditLog.objects.create(
                session=session,
                event_type='SCHEDULE_WARNING',
                performed_by=cashier,
                notes=f'Jadwal shift {shift_type} pada {today} belum dikonfirmasi'
            )

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active (open) session for current user or cashier"""
        cashier_id = request.query_params.get('cashier_id')
        branch_id = request.query_params.get('branch_id')

        queryset = self.get_queryset().filter(status='OPEN')

        if cashier_id:
            queryset = queryset.filter(cashier_id=cashier_id)
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)

        sessions = queryset.order_by('-opened_at')
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def check_schedule(self, request):
        """Check if cashier has schedule for opening session"""
        cashier_id = request.query_params.get('cashier_id')
        shift_type = request.query_params.get('shift_type')

        if not cashier_id or not shift_type:
            return Response({
                'error': 'cashier_id and shift_type are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            cashier = Staff.objects.get(id=cashier_id)
        except Staff.DoesNotExist:
            return Response({
                'error': 'Cashier not found'
            }, status=status.HTTP_404_NOT_FOUND)

        # Check today's schedule
        today = timezone.now().date()
        schedule = Schedule.objects.filter(
            staff=cashier,
            date=today,
            shift_type=shift_type
        ).first()

        if schedule:
            return Response({
                'has_schedule': True,
                'is_confirmed': schedule.is_confirmed,
                'schedule': {
                    'id': schedule.id,
                    'date': schedule.date,
                    'shift_type': schedule.shift_type,
                    'start_time': schedule.start_time,
                    'end_time': schedule.end_time,
                    'is_confirmed': schedule.is_confirmed,
                    'notes': schedule.notes
                },
                'message': 'Jadwal ditemukan' if schedule.is_confirmed else 'Jadwal ditemukan tetapi belum dikonfirmasi'
            })
        else:
            return Response({
                'has_schedule': False,
                'is_confirmed': False,
                'schedule': None,
                'message': f'Tidak ada jadwal terdaftar untuk shift {shift_type} hari ini',
                'warning': 'Anda dapat membuka sesi tanpa jadwal, tetapi akan dicatat sebagai peringatan'
            })

    @action(detail=True, methods=['get'])
    def validate_settlement(self, request, pk=None):
        """Check if session is ready to be closed (all orders settled)"""
        session = self.get_object()

        if session.status == 'CLOSED':
            return Response({'error': 'Session already closed'}, status=status.HTTP_400_BAD_REQUEST)

        # Get all payments in this session
        payment_order_ids = session.payments.values_list('order_id', flat=True)
        orders = Order.objects.filter(id__in=payment_order_ids)

        # Check for unsettled orders (not COMPLETED or CANCELLED)
        unsettled_orders = orders.exclude(status__in=['COMPLETED', 'CANCELLED'])

        if unsettled_orders.exists():
            unsettled_list = []
            for order in unsettled_orders:
                unsettled_list.append({
                    'id': order.id,
                    'order_number': order.order_number,
                    'status': order.status,
                    'table_number': order.table.number if order.table else None,
                    'total_amount': float(order.total_amount)
                })

            return Response({
                'can_close': False,
                'message': 'Cannot close session: unsettled orders exist',
                'unsettled_orders': unsettled_list,
                'count': unsettled_orders.count()
            })

        return Response({
            'can_close': True,
            'message': 'All orders settled, ready to close session'
        })

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close the cashier session (settlement)"""
        from .models import SessionAuditLog

        session = self.get_object()

        if session.status == 'CLOSED':
            return Response({'error': 'Session already closed'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate all orders are settled
        payment_order_ids = session.payments.values_list('order_id', flat=True)
        orders = Order.objects.filter(id__in=payment_order_ids)
        unsettled_orders = orders.exclude(status__in=['COMPLETED', 'CANCELLED'])

        if unsettled_orders.exists():
            return Response({
                'error': 'Cannot close session: unsettled orders exist',
                'unsettled_count': unsettled_orders.count()
            }, status=status.HTTP_400_BAD_REQUEST)

        # Parse request data
        close_serializer = CashierSessionCloseSerializer(data=request.data)
        if not close_serializer.is_valid():
            return Response(close_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Calculate settlement
        expected_cash, settlement_data = session.calculate_settlement()

        # Update session
        session.actual_cash = close_serializer.validated_data['actual_cash']
        session.expected_cash = expected_cash
        session.cash_difference = session.actual_cash - expected_cash
        session.settlement_data = settlement_data
        session.closed_at = timezone.now()
        session.status = 'CLOSED'

        if 'closed_by' in close_serializer.validated_data:
            session.closed_by = Staff.objects.get(id=close_serializer.validated_data['closed_by'])
        if 'notes' in close_serializer.validated_data:
            session.notes = close_serializer.validated_data['notes']

        session.save()

        # Create audit log for session closing
        SessionAuditLog.objects.create(
            session=session,
            event_type='SESSION_CLOSED',
            performed_by=session.closed_by or session.cashier,
            event_data={
                'expected_cash': str(expected_cash),
                'actual_cash': str(session.actual_cash),
                'cash_difference': str(session.cash_difference),
                'settlement_data': settlement_data
            }
        )

        # Log cash discrepancy if significant
        if abs(session.cash_difference) > 1000:  # More than Rp 1,000 difference
            SessionAuditLog.objects.create(
                session=session,
                event_type='CASH_DISCREPANCY',
                performed_by=session.closed_by or session.cashier,
                notes=f'Selisih kas: Rp {session.cash_difference:,.2f}',
                event_data={
                    'expected': str(expected_cash),
                    'actual': str(session.actual_cash),
                    'difference': str(session.cash_difference)
                }
            )

        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def report(self, request, pk=None):
        """Get detailed session report with all transactions"""
        session = self.get_object()

        # Get all payments and related orders
        payments = session.payments.all()
        transactions = []

        for payment in payments:
            order = payment.order
            items = []
            for item in order.items.all():
                items.append({
                    'product_name': item.product.name,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'subtotal': float(item.subtotal)
                })

            transactions.append({
                'order_number': order.order_number,
                'table_number': order.table.number if order.table else None,
                'customer_name': order.customer_name,
                'total_amount': float(order.total_amount),
                'payment_method': payment.payment_method,
                'status': order.status,
                'created_at': order.created_at.isoformat(),
                'items': items
            })

        return Response({
            'session': self.get_serializer(session).data,
            'transactions': transactions,
            'summary': session.settlement_data
        })


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["branch", "product", "is_active"]
    search_fields = ["product__name", "notes"]
    ordering = ["product__name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Prefetch related data for better performance
        return queryset.select_related("product", "branch").prefetch_related("ingredients__inventory_item")


class RecipeIngredientViewSet(viewsets.ModelViewSet):
    queryset = RecipeIngredient.objects.all()
    serializer_class = RecipeIngredientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["recipe", "inventory_item"]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related("recipe__product", "inventory_item")

