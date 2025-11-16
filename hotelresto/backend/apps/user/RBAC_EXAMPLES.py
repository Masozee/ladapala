"""
RBAC Usage Examples
These examples show how to implement role-based access control in your views
"""

# ============================================================================
# Example 1: Class-Based View with Permission Classes
# ============================================================================

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.user.permissions import IsAdmin, CanManageBookings, HasRole


class UserListView(APIView):
    """Only admins can list all users"""
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.user.models import User
        from apps.user.serializers import UserSerializer

        users = User.objects.all()
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)


class BookingCreateView(APIView):
    """ADMIN, MANAGER, and RECEPTIONIST can create bookings"""
    permission_classes = [CanManageBookings]

    def post(self, request):
        # Your booking creation logic here
        return Response({'message': 'Booking created'}, status=status.HTTP_201_CREATED)


class CustomRoleView(APIView):
    """Custom role requirements using HasRole permission"""
    permission_classes = [HasRole]
    required_roles = ['ADMIN', 'MANAGER', 'SUPERVISOR']  # Specify allowed roles

    def get(self, request):
        return Response({'message': 'Access granted'})


# ============================================================================
# Example 2: Function-Based Views with Decorators
# ============================================================================

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from apps.user.permissions import role_required, permission_required


@api_view(['GET'])
@role_required('ADMIN', 'MANAGER')
def financial_reports(request):
    """Only ADMIN and MANAGER can view financial reports"""
    return Response({
        'revenue': 150000,
        'expenses': 80000,
        'profit': 70000
    })


@api_view(['POST'])
@permission_required('can_manage_housekeeping')
def create_housekeeping_task(request):
    """Only users with housekeeping permission can create tasks"""
    # ADMIN, MANAGER, SUPERVISOR, HOUSEKEEPING can access
    return Response({'message': 'Task created'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Just check authentication
def public_dashboard(request):
    """All authenticated users can access"""
    return Response({'message': 'Welcome to dashboard'})


# ============================================================================
# Example 3: ViewSet with Role-Based Permissions
# ============================================================================

from rest_framework import viewsets
from rest_framework.decorators import action


class BookingViewSet(viewsets.ModelViewSet):
    """Booking management with different permissions for different actions"""
    permission_classes = [HasRole]

    def get_required_roles(self):
        """Define different roles for different actions"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return ['ADMIN', 'MANAGER', 'RECEPTIONIST']
        elif self.action in ['list', 'retrieve']:
            return ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'SUPERVISOR']
        return []

    def get_permissions(self):
        """Apply permissions based on action"""
        self.required_roles = self.get_required_roles()
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    @permission_required('can_view_reports')
    def statistics(self, request):
        """Only managers and admins can view booking statistics"""
        return Response({'total_bookings': 150})


# ============================================================================
# Example 4: Manual Permission Checking in Views
# ============================================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    """Delete user - only admins can delete users"""

    # Manual permission check
    if not request.user.can_manage_users():
        return Response(
            {'error': 'Only administrators can delete users'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Delete logic here
    return Response({'message': 'User deleted'})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_room_status(request, room_id):
    """Update room status with conditional permissions"""

    # Check if user can manage housekeeping
    if not request.user.can_manage_housekeeping():
        return Response(
            {'error': 'You do not have permission to update room status'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Update logic here
    return Response({'message': 'Room status updated'})


# ============================================================================
# Example 5: Conditional Logic Based on Role
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_bookings(request):
    """Get bookings - different data based on role"""
    from apps.hotel.models import Booking

    # Admins and managers see all bookings
    if request.user.is_manager():
        bookings = Booking.objects.all()

    # Receptionists see only current/future bookings
    elif request.user.has_role('RECEPTIONIST'):
        from django.utils import timezone
        bookings = Booking.objects.filter(check_in__gte=timezone.now().date())

    # Other roles see only their own bookings (if they have employee record)
    elif hasattr(request.user, 'employee'):
        bookings = Booking.objects.filter(created_by=request.user)

    else:
        return Response(
            {'error': 'You do not have permission to view bookings'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Serialize and return
    return Response({'bookings': []})


# ============================================================================
# Example 6: Combining Multiple Permission Checks
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_leave_request(request, employee_id):
    """Approve employee leave - requires multiple checks"""

    # Check 1: Must be manager or above
    if not request.user.is_manager():
        return Response(
            {'error': 'Only managers can approve leave requests'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Check 2: Cannot approve your own leave
    if hasattr(request.user, 'employee') and request.user.employee.id == employee_id:
        return Response(
            {'error': 'You cannot approve your own leave request'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Approval logic here
    return Response({'message': 'Leave request approved'})


# ============================================================================
# Example 7: Protecting Sensitive Data Based on Role
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_employee_details(request, employee_id):
    """Get employee details - sensitive data only for managers"""
    from apps.user.models import Employee
    from apps.user.serializers import EmployeeSerializer

    try:
        employee = Employee.objects.get(id=employee_id)
    except Employee.DoesNotExist:
        return Response(
            {'error': 'Employee not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Serialize with different fields based on role
    serializer = EmployeeSerializer(employee)
    data = serializer.data

    # Remove sensitive fields if not manager
    if not request.user.is_manager():
        # Remove salary, emergency contact, etc.
        data.pop('salary', None)
        data.pop('emergency_contact', None)
        data.pop('emergency_phone', None)

    return Response(data)


# ============================================================================
# Example 8: Frontend Permission Check Response
# ============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_permissions(request):
    """Return user's permissions for frontend to use"""
    return Response({
        'role': request.user.role,
        'permissions': {
            'can_manage_users': request.user.can_manage_users(),
            'can_manage_bookings': request.user.can_manage_bookings(),
            'can_manage_housekeeping': request.user.can_manage_housekeeping(),
            'can_view_reports': request.user.can_view_reports(),
            'can_manage_inventory': request.user.can_manage_inventory(),
            'is_admin': request.user.is_admin(),
            'is_manager': request.user.is_manager(),
            'is_supervisor': request.user.is_supervisor(),
        }
    })
