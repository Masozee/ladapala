from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
    filterset_fields = ['status', 'priority', 'task_type', 'assigned_to', 'scheduled_date']
    search_fields = ['task_number', 'room__number', 'notes']
    ordering_fields = ['scheduled_date', 'priority', 'created_at', 'estimated_completion']
    ordering = ['-scheduled_date', '-priority']

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
        """Mark a task as completed and ready for inspection"""
        task = self.get_object()

        if task.status != 'CLEANING':
            return Response(
                {'error': 'Task can only be completed from CLEANING status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        task.complete_task()
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
            completed_tasks=Count('id', filter=Q(status='CLEAN')),
            avg_duration=Avg('duration_minutes', filter=Q(completion_time__isnull=False))
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
