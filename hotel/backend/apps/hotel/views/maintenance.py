from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.utils import timezone

from ..models import MaintenanceRequest, MaintenanceTechnician, Complaint
from ..serializers import MaintenanceRequestSerializer, MaintenanceTechnicianSerializer, ComplaintSerializer


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
        """Override list to include engineering complaints and statistics"""
        # Get maintenance requests
        maintenance_requests = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(maintenance_requests)

        if page is not None:
            maintenance_serializer = self.get_serializer(page, many=True)
            maintenance_data = maintenance_serializer.data
        else:
            maintenance_serializer = self.get_serializer(maintenance_requests, many=True)
            maintenance_data = maintenance_serializer.data

        # Get complaints assigned to ENGINEERING team
        engineering_complaints = Complaint.objects.filter(
            assigned_team='ENGINEERING'
        ).exclude(
            status='CLOSED'  # Don't show closed complaints
        ).select_related('room', 'guest').order_by('-created_at')

        complaint_serializer = ComplaintSerializer(engineering_complaints, many=True)

        # Transform complaints to match maintenance request format
        complaints_as_maintenance = []
        for complaint in complaint_serializer.data:
            complaints_as_maintenance.append({
                'id': f"COMPLAINT_{complaint['id']}",  # Prefix to distinguish
                'request_number': complaint['complaint_number'],
                'title': complaint['title'],
                'description': complaint['description'],
                'category': 'General',  # Map complaint category if needed
                'priority': complaint['priority'],
                'status': complaint['status'].replace('OPEN', 'SUBMITTED').replace('RESOLVED', 'COMPLETED'),
                'source': 'GUEST_REQUEST',
                'room': complaint.get('room'),
                'room_number': complaint.get('room_number'),
                'guest': complaint.get('guest'),
                'guest_name': complaint.get('guest_name'),
                'assigned_technician': complaint.get('assigned_to'),
                'technician_notes': complaint.get('resolution'),
                'requested_date': complaint['incident_date'],
                'created_at': complaint['created_at'],
                'updated_at': complaint['updated_at'],
                'is_complaint': True,  # Flag to identify complaints
                'complaint_id': complaint['id'],  # Original complaint ID
            })

        # Combine both lists
        combined_results = list(maintenance_data) + complaints_as_maintenance

        # Calculate statistics
        all_requests = self.get_queryset()
        all_complaints = engineering_complaints

        status_counters = {
            'submitted': all_requests.filter(status='SUBMITTED').count() + all_complaints.filter(status='OPEN').count(),
            'acknowledged': all_requests.filter(status='ACKNOWLEDGED').count(),
            'in_progress': all_requests.filter(status='IN_PROGRESS').count() + all_complaints.filter(status='IN_PROGRESS').count(),
            'completed': all_requests.filter(status='COMPLETED').count() + all_complaints.filter(status='RESOLVED').count(),
            'urgent': all_requests.filter(priority='URGENT', status__in=['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS']).count() + all_complaints.filter(priority='URGENT').exclude(status='RESOLVED').count(),
            'total': all_requests.count() + all_complaints.count(),
        }

        if page is not None:
            return self.get_paginated_response({
                'results': combined_results,
                'status_counters': status_counters
            })

        return Response({
            'results': combined_results,
            'status_counters': status_counters
        })

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

    @action(detail=False, methods=['patch'], url_path='complaint/(?P<complaint_id>[0-9]+)/(?P<action_name>[a-z_]+)')
    def update_complaint(self, request, complaint_id=None, action_name=None):
        """Update complaint status from maintenance page"""
        try:
            complaint = Complaint.objects.get(id=complaint_id)

            if complaint.assigned_team != 'ENGINEERING':
                return Response(
                    {'error': 'This complaint is not assigned to Engineering team'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Map maintenance actions to complaint statuses
            if action_name == 'acknowledge':
                if complaint.status != 'OPEN':
                    return Response(
                        {'error': 'Only open complaints can be acknowledged'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                complaint.status = 'IN_PROGRESS'
                complaint.save(update_fields=['status', 'updated_at'])

            elif action_name == 'start_work':
                if complaint.status not in ['OPEN', 'IN_PROGRESS']:
                    return Response(
                        {'error': 'Complaint must be open or in progress to start work'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                complaint.status = 'IN_PROGRESS'
                complaint.save(update_fields=['status', 'updated_at'])

            elif action_name == 'complete':
                if complaint.status != 'IN_PROGRESS':
                    return Response(
                        {'error': 'Only in-progress complaints can be completed'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                complaint.status = 'RESOLVED'
                complaint.resolved_at = timezone.now()

                # Get resolution notes from request if provided
                resolution = request.data.get('resolution')
                if resolution:
                    complaint.resolution = resolution

                complaint.save(update_fields=['status', 'resolved_at', 'resolution', 'updated_at'])

            else:
                return Response(
                    {'error': f'Invalid action: {action_name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Return serialized complaint data
            serializer = ComplaintSerializer(complaint)
            return Response(serializer.data)

        except Complaint.DoesNotExist:
            return Response(
                {'error': 'Complaint not found'},
                status=status.HTTP_404_NOT_FOUND
            )


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
