from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.utils import timezone

from ..models import MaintenanceRequest, MaintenanceTechnician
from ..serializers import MaintenanceRequestSerializer, MaintenanceTechnicianSerializer


class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing maintenance requests"""
    queryset = MaintenanceRequest.objects.select_related('room', 'guest')
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['category', 'priority', 'status', 'source']
    search_fields = ['request_number', 'title', 'description', 'room__number']
    ordering_fields = ['requested_date', 'priority', 'created_at']
    ordering = ['-requested_date']

    def list(self, request, *args, **kwargs):
        """Override list to include statistics"""
        response = super().list(request, *args, **kwargs)

        # Calculate statistics
        all_requests = self.get_queryset()

        status_counters = {
            'submitted': all_requests.filter(status='SUBMITTED').count(),
            'acknowledged': all_requests.filter(status='ACKNOWLEDGED').count(),
            'in_progress': all_requests.filter(status='IN_PROGRESS').count(),
            'completed': all_requests.filter(status='COMPLETED').count(),
            'urgent': all_requests.filter(priority='URGENT', status__in=['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS']).count(),
            'total': all_requests.count(),
        }

        # Add counters to response
        response.data['status_counters'] = status_counters

        return response

    @action(detail=True, methods=['patch'])
    def acknowledge(self, request, pk=None):
        """Acknowledge a maintenance request"""
        maintenance_request = self.get_object()

        if maintenance_request.status != 'SUBMITTED':
            return Response(
                {'error': 'Only submitted requests can be acknowledged'},
                status=status.HTTP_400_BAD_REQUEST
            )

        maintenance_request.status = 'ACKNOWLEDGED'
        maintenance_request.acknowledged_date = timezone.now()
        maintenance_request.save(update_fields=['status', 'acknowledged_date', 'updated_at'])

        serializer = self.get_serializer(maintenance_request)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def start_work(self, request, pk=None):
        """Start working on a maintenance request"""
        maintenance_request = self.get_object()

        if maintenance_request.status not in ['SUBMITTED', 'ACKNOWLEDGED']:
            return Response(
                {'error': 'Request must be submitted or acknowledged to start work'},
                status=status.HTTP_400_BAD_REQUEST
            )

        maintenance_request.status = 'IN_PROGRESS'
        maintenance_request.started_date = timezone.now()

        # Set acknowledged_date if not set
        if not maintenance_request.acknowledged_date:
            maintenance_request.acknowledged_date = timezone.now()

        maintenance_request.save(update_fields=['status', 'started_date', 'acknowledged_date', 'updated_at'])

        serializer = self.get_serializer(maintenance_request)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def complete(self, request, pk=None):
        """Complete a maintenance request"""
        maintenance_request = self.get_object()
        actual_cost = request.data.get('actual_cost')
        technician_notes = request.data.get('technician_notes')

        if maintenance_request.status != 'IN_PROGRESS':
            return Response(
                {'error': 'Only in-progress requests can be completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        maintenance_request.status = 'COMPLETED'
        maintenance_request.completed_date = timezone.now()

        if actual_cost is not None:
            maintenance_request.actual_cost = actual_cost

        if technician_notes:
            maintenance_request.technician_notes = technician_notes

        maintenance_request.save(update_fields=[
            'status', 'completed_date', 'actual_cost', 'technician_notes', 'updated_at'
        ])

        serializer = self.get_serializer(maintenance_request)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def assign_technician(self, request, pk=None):
        """Assign a technician to a maintenance request"""
        maintenance_request = self.get_object()
        technician_name = request.data.get('technician_name')

        if not technician_name:
            return Response(
                {'error': 'technician_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        maintenance_request.assigned_technician = technician_name
        maintenance_request.save(update_fields=['assigned_technician', 'updated_at'])

        serializer = self.get_serializer(maintenance_request)
        return Response(serializer.data)


class MaintenanceTechnicianViewSet(viewsets.ModelViewSet):
    """ViewSet for managing maintenance technicians"""
    queryset = MaintenanceTechnician.objects.all()
    serializer_class = MaintenanceTechnicianSerializer
    permission_classes = [AllowAny]
    filter_backends = [SearchFilter]
    search_fields = ['name', 'contact_number', 'email']
    ordering = ['name']

    def list(self, request, *args, **kwargs):
        """Override list to only show active technicians by default"""
        queryset = self.get_queryset()

        # Filter by active status unless explicitly requested
        show_inactive = request.query_params.get('show_inactive', 'false').lower() == 'true'
        if not show_inactive:
            queryset = queryset.filter(is_active=True)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
