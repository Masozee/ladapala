from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count, Avg
from ..models import HousekeepingTask, AmenityUsage, InventoryItem
from ..serializers import HousekeepingTaskSerializer, AmenityUsageSerializer


class HousekeepingTaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing housekeeping tasks.
    Supports filtering by status, priority, assigned staff, and date.
    """
    queryset = HousekeepingTask.objects.select_related(
        'room', 'room__room_type', 'assigned_to', 'inspector', 'created_by'
    ).prefetch_related('amenity_usages', 'amenity_usages__inventory_item')
    serializer_class = HousekeepingTaskSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'priority', 'task_type', 'assigned_to', 'scheduled_date']
    search_fields = ['task_number', 'room__number', 'notes']
    ordering_fields = ['scheduled_date', 'priority', 'created_at', 'estimated_completion']
    ordering = ['-created_at']  # Latest tasks first

    def get_queryset(self):
        """Filter tasks based on query parameters"""
        queryset = super().get_queryset()

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(scheduled_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(scheduled_date__lte=end_date)

        # Filter by floor
        floor = self.request.query_params.get('floor')
        if floor:
            queryset = queryset.filter(room__floor=floor)

        # Filter by room type
        room_type = self.request.query_params.get('room_type')
        if room_type:
            queryset = queryset.filter(room__room_type_id=room_type)

        # Filter by overdue tasks
        overdue = self.request.query_params.get('overdue')
        if overdue == 'true':
            queryset = queryset.filter(
                estimated_completion__lt=timezone.now()
            ).exclude(status__in=['CLEAN', 'OUT_OF_ORDER'])

        return queryset

    def perform_create(self, serializer):
        """Set created_by when creating a task"""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def start_task(self, request, pk=None):
        """Mark a task as started"""
        task = self.get_object()

        if task.status != 'DIRTY':
            return Response(
                {'error': 'Task can only be started from DIRTY status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        task.start_task(user=request.user)
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete_task(self, request, pk=None):
        """Mark a task as completed and ready for inspection with amenity usage recording"""
        from apps.hotel.models import AmenityUsage, InventoryItem
        from django.db import transaction

        task = self.get_object()

        if task.status != 'CLEANING':
            return Response(
                {'error': 'Task can only be completed from CLEANING status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get amenity items from request (required)
        amenity_items = request.data.get('amenity_items', [])

        if not amenity_items:
            return Response(
                {'error': 'Please record items used before completing the task'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate amenity items format
        for item in amenity_items:
            if 'inventory_item' not in item or 'quantity_used' not in item:
                return Response(
                    {'error': 'Each item must have inventory_item and quantity_used'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if item['quantity_used'] <= 0:
                return Response(
                    {'error': 'Quantity must be greater than 0'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Use transaction to ensure atomicity
        with transaction.atomic():
            # Complete the task
            task.complete_task()

            # Create amenity usage records
            for item in amenity_items:
                try:
                    inventory_item = InventoryItem.objects.get(id=item['inventory_item'])

                    # Check stock availability
                    if inventory_item.current_stock < item['quantity_used']:
                        return Response(
                            {'error': f'Insufficient stock for {inventory_item.name}. Available: {inventory_item.current_stock}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    AmenityUsage.objects.create(
                        housekeeping_task=task,
                        inventory_item=inventory_item,
                        quantity_used=item['quantity_used'],
                        notes=item.get('notes', ''),
                        recorded_by=request.user
                    )
                except InventoryItem.DoesNotExist:
                    return Response(
                        {'error': f'Inventory item {item["inventory_item"]} not found'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def pass_inspection(self, request, pk=None):
        """Mark inspection as passed"""
        task = self.get_object()

        if task.status != 'INSPECTING':
            return Response(
                {'error': 'Task must be in INSPECTING status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        notes = request.data.get('notes')
        task.pass_inspection(inspector=request.user, notes=notes)

        # Update room status to AVAILABLE if it was being cleaned
        if task.room.status in ['MAINTENANCE', 'OUT_OF_ORDER']:
            task.room.status = 'AVAILABLE'
            task.room.save()

        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def fail_inspection(self, request, pk=None):
        """Mark inspection as failed"""
        task = self.get_object()

        if task.status != 'INSPECTING':
            return Response(
                {'error': 'Task must be in INSPECTING status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        notes = request.data.get('notes')
        if not notes:
            return Response(
                {'error': 'Notes are required when failing inspection'},
                status=status.HTTP_400_BAD_REQUEST
            )

        task.fail_inspection(inspector=request.user, notes=notes)
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def suggested_items(self, request, pk=None):
        """
        Get suggested amenity items based on task type and previous usage.
        For stayover: uses previous usage for this room
        For checkout: uses base template
        """
        from apps.hotel.models import AmenityUsage, InventoryItem, Reservation
        from django.db.models import Sum, Avg
        from collections import defaultdict

        task = self.get_object()
        suggestions = []

        # Base templates for different task types (standard room = 2 guests)
        BASE_TEMPLATES = {
            'CHECKOUT_CLEANING': [
                {'name': 'Bed Sheet', 'quantity': 2, 'category': 'Toiletries & Bath'},
                {'name': 'Bath Towel', 'quantity': 2, 'category': 'Toiletries & Bath'},
                {'name': 'Hand Towel', 'quantity': 2, 'category': 'Toiletries & Bath'},
                {'name': 'Shampoo', 'quantity': 2, 'category': 'Toiletries & Bath'},
                {'name': 'Soap', 'quantity': 4, 'category': 'Toiletries & Bath'},
                {'name': 'Toothbrush', 'quantity': 2, 'category': 'Toiletries & Bath'},
                {'name': 'Tissue', 'quantity': 2, 'category': 'Toiletries & Bath'},
            ],
            'STAYOVER_CLEANING': [],  # Will be based on previous usage
            'DEEP_CLEANING': [
                {'name': 'Bed Sheet', 'quantity': 2, 'category': 'Toiletries & Bath'},
                {'name': 'Bath Towel', 'quantity': 2, 'category': 'Toiletries & Bath'},
                {'name': 'Hand Towel', 'quantity': 2, 'category': 'Toiletries & Bath'},
                {'name': 'Detergent', 'quantity': 1, 'category': 'Laundry & Cleaning'},
            ],
        }

        # Get guest count from current reservation
        guest_count = 2  # Default
        current_reservation = Reservation.objects.filter(
            room=task.room,
            status__in=['CONFIRMED', 'CHECKED_IN']
        ).first()

        if current_reservation:
            guest_count = current_reservation.number_of_guests or current_reservation.room.room_type.max_occupancy

        # For STAYOVER: Get previous usage from this room's recent tasks
        if task.task_type == 'STAYOVER_CLEANING':
            # Get last 3 completed tasks for this room
            previous_tasks = HousekeepingTask.objects.filter(
                room=task.room,
                status='CLEAN',
                task_type__in=['CHECKOUT_CLEANING', 'STAYOVER_CLEANING']
            ).exclude(id=task.id).order_by('-completion_time')[:3]

            if previous_tasks.exists():
                # Aggregate usage from previous tasks
                usage_aggregate = AmenityUsage.objects.filter(
                    housekeeping_task__in=previous_tasks
                ).values('inventory_item', 'inventory_item__name', 'inventory_item__id')\
                 .annotate(avg_quantity=Avg('quantity_used'))\
                 .order_by('-avg_quantity')

                for usage in usage_aggregate:
                    try:
                        inventory_item = InventoryItem.objects.get(id=usage['inventory_item__id'])
                        suggestions.append({
                            'inventory_item': inventory_item.id,
                            'name': inventory_item.name,
                            'category': inventory_item.category.name,
                            'suggested_quantity': round(usage['avg_quantity']),
                            'current_stock': inventory_item.current_stock,
                            'unit': inventory_item.unit_of_measurement,
                            'reason': 'Based on previous usage for this room'
                        })
                    except InventoryItem.DoesNotExist:
                        continue

        # Use base template if no previous usage or for other task types
        if not suggestions and task.task_type in BASE_TEMPLATES:
            template = BASE_TEMPLATES[task.task_type]

            for item_template in template:
                # Try to find matching item (fuzzy match on name)
                inventory_items = InventoryItem.objects.filter(
                    name__icontains=item_template['name'].split()[0],  # Match first word
                    category__name__icontains=item_template['category'].split()[0],
                    is_active=True
                ).order_by('current_stock')  # Prefer items with stock

                if inventory_items.exists():
                    inventory_item = inventory_items.first()

                    suggestions.append({
                        'inventory_item': inventory_item.id,
                        'name': inventory_item.name,
                        'category': inventory_item.category.name,
                        'suggested_quantity': item_template['quantity'],
                        'current_stock': inventory_item.current_stock,
                        'unit': inventory_item.unit_of_measurement,
                        'reason': f'Standard template for {task.get_task_type_display()}'
                    })

        return Response({
            'task_id': task.id,
            'task_type': task.task_type,
            'task_type_display': task.get_task_type_display(),
            'room': task.room.number,
            'guest_count': guest_count,
            'suggestions': suggestions
        })

    @action(detail=True, methods=['post'])
    def add_amenities(self, request, pk=None):
        """Add amenity usage to a housekeeping task"""
        task = self.get_object()

        amenities = request.data.get('amenities', [])
        if not amenities:
            return Response(
                {'error': 'Amenities list is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_usages = []
        errors = []

        for amenity_data in amenities:
            inventory_item_id = amenity_data.get('inventory_item')
            quantity_used = amenity_data.get('quantity_used', 1)
            notes = amenity_data.get('notes', '')

            try:
                inventory_item = InventoryItem.objects.get(id=inventory_item_id)

                # Create amenity usage (stock will be deducted automatically)
                usage = AmenityUsage.objects.create(
                    housekeeping_task=task,
                    inventory_item=inventory_item,
                    quantity_used=quantity_used,
                    notes=notes,
                    recorded_by=request.user
                )
                created_usages.append(usage)

            except InventoryItem.DoesNotExist:
                errors.append(f'Inventory item {inventory_item_id} not found')
            except Exception as e:
                errors.append(f'Error adding amenity {inventory_item_id}: {str(e)}')

        response_data = {
            'created': AmenityUsageSerializer(created_usages, many=True).data,
            'errors': errors
        }

        if errors and not created_usages:
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get housekeeping statistics"""
        today = timezone.now().date()

        # Status counts
        status_stats = HousekeepingTask.objects.filter(
            scheduled_date=today
        ).values('status').annotate(count=Count('id'))

        # Priority counts
        priority_stats = HousekeepingTask.objects.filter(
            scheduled_date=today
        ).values('priority').annotate(count=Count('id'))

        # Staff performance
        staff_stats = HousekeepingTask.objects.filter(
            scheduled_date=today,
            assigned_to__isnull=False
        ).values(
            'assigned_to__id',
            'assigned_to__first_name',
            'assigned_to__last_name'
        ).annotate(
            active_tasks=Count('id', filter=Q(status__in=['CLEANING', 'INSPECTING'])),
            completed_tasks=Count('id', filter=Q(status='CLEAN'))
        )

        # Overdue tasks
        overdue_count = HousekeepingTask.objects.filter(
            estimated_completion__lt=timezone.now(),
            status__in=['DIRTY', 'CLEANING', 'INSPECTING']
        ).count()

        return Response({
            'status_stats': list(status_stats),
            'priority_stats': list(priority_stats),
            'staff_stats': list(staff_stats),
            'overdue_count': overdue_count,
            'date': today
        })

    @action(detail=False, methods=['get'])
    def today_tasks(self, request):
        """Get all tasks scheduled for today"""
        today = timezone.now().date()
        tasks = self.get_queryset().filter(scheduled_date=today)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)


class AmenityUsageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing amenity usage records.
    Automatically deducts stock from inventory when created.
    """
    queryset = AmenityUsage.objects.select_related(
        'housekeeping_task',
        'housekeeping_task__room',
        'inventory_item',
        'recorded_by'
    )
    serializer_class = AmenityUsageSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['housekeeping_task', 'inventory_item', 'recorded_by', 'stock_deducted']
    search_fields = ['inventory_item__name', 'notes']
    ordering_fields = ['recorded_at', 'quantity_used']
    ordering = ['-recorded_at']

    def get_queryset(self):
        """Filter usage records based on query parameters"""
        queryset = super().get_queryset()

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(recorded_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(recorded_at__lte=end_date)

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(inventory_item__category=category)

        return queryset

    def perform_create(self, serializer):
        """Set recorded_by when creating usage record"""
        serializer.save(recorded_by=self.request.user)

    @action(detail=False, methods=['get'])
    def usage_summary(self, request):
        """Get summary of amenity usage for a date range"""
        start_date = request.query_params.get('start_date', timezone.now().date())
        end_date = request.query_params.get('end_date', timezone.now().date())

        usage_data = AmenityUsage.objects.filter(
            recorded_at__date__gte=start_date,
            recorded_at__date__lte=end_date
        ).values(
            'inventory_item__id',
            'inventory_item__name',
            'inventory_item__category',
            'inventory_item__unit_price'
        ).annotate(
            total_quantity=Count('id'),
            total_cost=Count('id') * Avg('inventory_item__unit_price')
        ).order_by('-total_quantity')

        return Response({
            'start_date': start_date,
            'end_date': end_date,
            'usage_summary': list(usage_data)
        })
