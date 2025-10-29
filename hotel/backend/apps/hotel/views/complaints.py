from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.contrib.auth import get_user_model

from ..models import Complaint, ComplaintImage
from ..serializers import ComplaintSerializer, ComplaintImageSerializer

User = get_user_model()


class ComplaintViewSet(viewsets.ModelViewSet):
    """ViewSet for managing complaints"""
    queryset = Complaint.objects.select_related('guest', 'room', 'assigned_to').prefetch_related('images')
    serializer_class = ComplaintSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'priority', 'status', 'incident_date']
    search_fields = ['complaint_number', 'title', 'description']
    ordering_fields = ['incident_date', 'priority', 'created_at']
    ordering = ['-incident_date']

    def list(self, request, *args, **kwargs):
        """Override list to include statistics"""
        response = super().list(request, *args, **kwargs)

        # Calculate statistics
        all_complaints = self.get_queryset()

        status_counters = {
            'in_progress': all_complaints.filter(status='IN_PROGRESS').count(),
            'completed': all_complaints.filter(status__in=['RESOLVED', 'CLOSED']).count(),
            'escalated': 0,  # Will be used if escalation feature is added
            'urgent': all_complaints.filter(priority='URGENT', status__in=['OPEN', 'IN_PROGRESS']).count(),
            'high_priority': all_complaints.filter(priority='HIGH', status__in=['OPEN', 'IN_PROGRESS']).count(),
            'overdue': 0,  # Will be calculated based on SLA
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


class ComplaintImageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing complaint images"""
    queryset = ComplaintImage.objects.all()
    serializer_class = ComplaintImageSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        """Save the uploaded image"""
        serializer.save(uploaded_by=self.request.user if self.request.user.is_authenticated else None)