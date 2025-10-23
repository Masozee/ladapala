from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from ..models import Complaint
from ..serializers import ComplaintSerializer


class ComplaintViewSet(viewsets.ModelViewSet):
    """ViewSet for managing complaints"""
    queryset = Complaint.objects.select_related('guest', 'room')
    serializer_class = ComplaintSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'priority', 'status', 'incident_date']
    search_fields = ['complaint_number', 'title', 'description']
    ordering_fields = ['incident_date', 'priority', 'created_at']
    ordering = ['-incident_date']

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
    
    @action(detail=False, methods=['get'], url_path='by-number/(?P<complaint_number>[^/.]+)')
    def by_number(self, request, complaint_number=None):
        """Get complaint by complaint number"""
        try:
            complaint = self.get_queryset().get(complaint_number=complaint_number)
            serializer = self.get_serializer(complaint)
            return Response(serializer.data)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found'}, status=status.HTTP_404_NOT_FOUND)