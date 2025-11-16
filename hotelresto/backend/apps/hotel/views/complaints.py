from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.contrib.auth import get_user_model

from ..models import Complaint, ComplaintImage, HousekeepingTask
from ..serializers import ComplaintSerializer, ComplaintImageSerializer

User = get_user_model()


class ComplaintViewSet(viewsets.ModelViewSet):
    """ViewSet for managing complaints"""
    queryset = Complaint.objects.select_related('guest', 'room', 'assigned_to').prefetch_related('images')
    serializer_class = ComplaintSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'priority', 'status', 'incident_date', 'assigned_team']
    search_fields = ['complaint_number', 'title', 'description']
    ordering_fields = ['incident_date', 'priority', 'created_at']
    ordering = ['-incident_date']

    def list(self, request, *args, **kwargs):
        """Override list to include statistics"""
        response = super().list(request, *args, **kwargs)

        # Calculate statistics
        all_complaints = self.get_queryset()

        # Count escalated complaints (HIGH or URGENT priority and not resolved)
        escalated_count = all_complaints.filter(
            priority__in=['HIGH', 'URGENT'],
            status__in=['OPEN', 'IN_PROGRESS']
        ).count()

        # Count overdue complaints using model property
        overdue_count = sum(1 for c in all_complaints if c.is_overdue)

        status_counters = {
            'in_progress': all_complaints.filter(status='IN_PROGRESS').count(),
            'completed': all_complaints.filter(status__in=['RESOLVED', 'CLOSED']).count(),
            'escalated': escalated_count,
            'urgent': all_complaints.filter(priority='URGENT', status__in=['OPEN', 'IN_PROGRESS']).count(),
            'high_priority': all_complaints.filter(priority='HIGH', status__in=['OPEN', 'IN_PROGRESS']).count(),
            'overdue': overdue_count,
        }

        # Add counters to response
        response.data['status_counters'] = status_counters

        return response

    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """Get urgent complaints"""
        urgent_complaints = self.get_queryset().filter(
            priority__in=['HIGH', 'URGENT'],
            status__in=['OPEN', 'IN_PROGRESS']
        )
        serializer = self.get_serializer(urgent_complaints, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unresolved(self, request):
        """Get unresolved complaints"""
        unresolved = self.get_queryset().filter(
            status__in=['OPEN', 'IN_PROGRESS']
        )
        serializer = self.get_serializer(unresolved, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def resolve(self, request, pk=None):
        """Resolve a complaint"""
        complaint = self.get_object()
        resolution = request.data.get('resolution')

        if not resolution:
            return Response({'error': 'resolution field is required'},
                          status=status.HTTP_400_BAD_REQUEST)

        complaint.status = 'RESOLVED'
        complaint.resolution = resolution
        complaint.resolved_at = timezone.now()
        complaint.save(update_fields=['status', 'resolution', 'resolved_at', 'updated_at'])

        serializer = self.get_serializer(complaint)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign_staff(self, request, pk=None):
        """Assign complaint to staff member"""
        complaint = self.get_object()
        user_id = request.data.get('user_id')

        if not user_id:
            return Response({'error': 'user_id is required'},
                          status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'},
                          status=status.HTTP_404_NOT_FOUND)

        complaint.assigned_to = user
        if complaint.status == 'OPEN':
            complaint.status = 'IN_PROGRESS'
        complaint.save(update_fields=['assigned_to', 'status', 'updated_at'])

        serializer = self.get_serializer(complaint)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='by-number/(?P<complaint_number>[^/.]+)')
    def by_number(self, request, complaint_number=None):
        """Get complaint by complaint number"""
        try:
            complaint = self.get_queryset().get(complaint_number=complaint_number)
            serializer = self.get_serializer(complaint)
            return Response(serializer.data)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def add_response(self, request, pk=None):
        """Add a response to a complaint"""
        complaint = self.get_object()
        message = request.data.get('message')

        if not message:
            return Response({'error': 'message field is required'},
                          status=status.HTTP_400_BAD_REQUEST)

        # For now, just update the complaint's resolution field with the response
        # In a full implementation, you might have a separate ComplaintResponse model
        action_taken = request.data.get('action_taken', '')

        if complaint.resolution:
            complaint.resolution += f"\n\n---\n{message}"
        else:
            complaint.resolution = message

        if action_taken:
            complaint.resolution += f"\n\nAction Taken: {action_taken}"

        complaint.save(update_fields=['resolution', 'updated_at'])

        serializer = self.get_serializer(complaint)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Override update to create housekeeping task when assigned to HOUSEKEEPING team"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Check if assigned_team is being changed to HOUSEKEEPING
        old_team = instance.assigned_team
        new_team = request.data.get('assigned_team')

        # Perform the update
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Create housekeeping task if assigned to HOUSEKEEPING and task doesn't exist yet
        response_data = serializer.data
        if new_team == 'HOUSEKEEPING' and old_team != 'HOUSEKEEPING':
            if instance.room:
                if not instance.housekeeping_tasks.exists():
                    # Map complaint status to housekeeping status
                    housekeeping_status = 'DIRTY'  # Default
                    if instance.status == 'IN_PROGRESS':
                        housekeeping_status = 'CLEANING'
                    elif instance.status in ['RESOLVED', 'CLOSED']:
                        housekeeping_status = 'CLEAN'

                    task = HousekeepingTask.objects.create(
                        room=instance.room,
                        complaint=instance,
                        task_type='COMPLAINT',
                        status=housekeeping_status,
                        priority=instance.priority,
                        notes=f"From complaint #{instance.complaint_number}: {instance.title}\n\n{instance.description}",
                        created_by=request.user if request.user.is_authenticated else None
                    )
                    response_data['housekeeping_task_created'] = True
                    response_data['housekeeping_task_number'] = task.task_number
            else:
                # Warning: No room assigned, cannot create housekeeping task
                response_data['warning'] = 'Complaint assigned to Housekeeping team but no room is specified. Please assign a room to create a housekeeping task.'

        return Response(response_data)

    def partial_update(self, request, *args, **kwargs):
        """Override partial_update to use the same logic as update"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class ComplaintImageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing complaint images"""
    queryset = ComplaintImage.objects.all()
    serializer_class = ComplaintImageSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        """Save the uploaded image"""
        serializer.save(uploaded_by=self.request.user if self.request.user.is_authenticated else None)