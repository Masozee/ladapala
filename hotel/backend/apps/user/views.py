from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from .serializers import (
    UserSerializer, UserUpdateSerializer, UserProfileUpdateSerializer,
    ShiftSerializer
)
from .models import UserProfile, Shift
from django.db import transaction


class LoginView(APIView):
    """Session-based login view"""
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        """Get CSRF token for login form"""
        return Response({'detail': 'CSRF cookie set'})

    @method_decorator(csrf_exempt)
    def post(self, request, *args, **kwargs):
        """Login with email and password using session authentication"""
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate user
        user = authenticate(request, username=email, password=password)

        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'User account is disabled'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Login user (creates session)
        django_login(request, user)

        # Get employee info if available
        employee_info = None
        if hasattr(user, 'employee'):
            employee = user.employee
            employee_info = {
                'id': employee.id,
                'employee_id': employee.employee_id,
                'full_name': employee.full_name,
                'position': employee.position,
                'department': {
                    'id': employee.department.id,
                    'name': employee.department.name
                } if employee.department else None
            }

        # Get user profile if available
        profile_info = None
        if hasattr(user, 'userprofile'):
            profile = user.userprofile
            profile_info = {
                'role': profile.role,
                'phone': profile.phone,
            }

        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.full_name,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            },
            'employee': employee_info,
            'profile': profile_info,
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    """Session-based logout endpoint"""
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Not authenticated'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    django_logout(request)
    return Response(
        {'message': 'Successfully logged out'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
def check_session(request):
    """Check if user has active session"""
    if request.user.is_authenticated:
        # Get employee info if available
        employee_info = None
        if hasattr(request.user, 'employee'):
            employee = request.user.employee
            employee_info = {
                'id': employee.id,
                'employee_id': employee.employee_id,
                'full_name': employee.full_name,
                'position': employee.position,
                'department': {
                    'id': employee.department.id,
                    'name': employee.department.name
                } if employee.department else None
            }

        # Get user profile if available
        profile_info = None
        if hasattr(request.user, 'userprofile'):
            profile = request.user.userprofile
            profile_info = {
                'role': profile.role,
                'phone': profile.phone,
            }

        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'full_name': request.user.full_name,
                'is_staff': request.user.is_staff,
                'is_superuser': request.user.is_superuser,
            },
            'employee': employee_info,
            'profile': profile_info,
        })
    else:
        return Response({
            'authenticated': False
        })


@api_view(['GET', 'PUT', 'PATCH'])
def user_profile(request):
    """Get or update current user profile"""
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        # Get employee info if available
        employee_info = None
        if hasattr(request.user, 'employee'):
            employee = request.user.employee
            employee_info = {
                'id': employee.id,
                'employee_id': employee.employee_id,
                'full_name': employee.full_name,
                'position': employee.position,
                'department': {
                    'id': employee.department.id,
                    'name': employee.department.name
                } if employee.department else None
            }

        # Get user profile if available
        profile_info = None
        if hasattr(request.user, 'userprofile'):
            profile = request.user.userprofile
            profile_info = {
                'id': profile.id,
                'role': profile.role,
                'phone': profile.phone,
                'bio': profile.bio,
                'address': profile.address,
                'date_of_birth': profile.date_of_birth,
                'avatar': request.build_absolute_uri(profile.avatar.url) if profile.avatar else None,
            }

        return Response({
            'user': {
                'id': request.user.id,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'full_name': request.user.full_name,
                'is_staff': request.user.is_staff,
                'is_superuser': request.user.is_superuser,
            },
            'employee': employee_info,
            'profile': profile_info,
        })

    elif request.method in ['PUT', 'PATCH']:
        # Update user and profile
        with transaction.atomic():
            # Update user basic info
            user_data = {
                'first_name': request.data.get('first_name', request.user.first_name),
                'last_name': request.data.get('last_name', request.user.last_name),
            }
            user_serializer = UserUpdateSerializer(request.user, data=user_data, partial=True)
            if user_serializer.is_valid():
                user_serializer.save()
            else:
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Update or create user profile
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            profile_data = {
                'phone': request.data.get('phone', profile.phone),
                'bio': request.data.get('bio', profile.bio),
                'address': request.data.get('address', profile.address),
                'date_of_birth': request.data.get('date_of_birth', profile.date_of_birth),
            }

            # Handle avatar upload if present
            if 'avatar' in request.FILES:
                profile_data['avatar'] = request.FILES['avatar']

            profile_serializer = UserProfileUpdateSerializer(profile, data=profile_data, partial=True)
            if profile_serializer.is_valid():
                profile_serializer.save()
            else:
                return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Return updated profile
        serializer = UserSerializer(request.user, context={'request': request})
        return Response({
            'message': 'Profile updated successfully',
            'user': serializer.data
        })


@api_view(['GET'])
def user_shifts(request):
    """Get current user's shifts/schedule"""
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    # Check if user has employee record
    if not hasattr(request.user, 'employee'):
        return Response({
            'shifts': [],
            'message': 'No employee record found for this user'
        })

    employee = request.user.employee

    # Get query parameters
    from_date = request.query_params.get('from_date')
    to_date = request.query_params.get('to_date')

    # Filter shifts
    shifts = Shift.objects.filter(employee=employee)

    if from_date:
        shifts = shifts.filter(shift_date__gte=from_date)
    if to_date:
        shifts = shifts.filter(shift_date__lte=to_date)

    shifts = shifts.order_by('-shift_date', 'start_time')[:50]  # Limit to 50 most recent

    serializer = ShiftSerializer(shifts, many=True, context={'request': request})
    return Response({
        'shifts': serializer.data,
        'employee': {
            'id': employee.id,
            'employee_id': employee.employee_id,
            'full_name': employee.full_name,
            'position': employee.position,
        }
    })


@api_view(['GET'])
def active_session(request):
    """Get current user's active session with full profile (clocked in but not clocked out)"""
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    from .models import Attendance
    from django.utils import timezone
    from .serializers import UserSerializer

    # Get full user profile data
    user_serializer = UserSerializer(request.user, context={'request': request})

    response_data = {
        'user': user_serializer.data,
        'active_session': None,
        'employee': None
    }

    # Check if user has employee record
    if not hasattr(request.user, 'employee'):
        print(f"[DEBUG] User {request.user.email} has no employee record")
        response_data['message'] = 'No employee record found for this user'
        return Response(response_data)

    employee = request.user.employee
    print(f"[DEBUG] Checking active session for: {request.user.email} (Employee: {employee.full_name})")

    # Add employee data
    response_data['employee'] = {
        'id': employee.id,
        'employee_id': employee.employee_id,
        'full_name': employee.full_name,
        'first_name': employee.first_name,
        'last_name': employee.last_name,
        'position': employee.position,
        'department': employee.department.name if employee.department else None,
        'department_id': employee.department.id if employee.department else None,
        'employment_status': employee.employment_status,
        'employment_status_display': employee.get_employment_status_display(),
        'hire_date': employee.hire_date,
        'termination_date': employee.termination_date,
        'salary': str(employee.salary) if employee.salary else None,
        'phone': employee.phone,
        'email': employee.email,
        'address': employee.address,
        'emergency_contact': employee.emergency_contact,
        'emergency_phone': employee.emergency_phone,
        'is_active': employee.is_active,
        'created_at': employee.created_at,
        'updated_at': employee.updated_at,
    }

    # Get active attendance (clocked in but not clocked out)
    active_attendance = Attendance.objects.filter(
        shift__employee=employee,
        clock_in__isnull=False,
        clock_out__isnull=True
    ).select_related('shift', 'shift__employee').order_by('-clock_in').first()

    if not active_attendance:
        print(f"[DEBUG] No active attendance found for {request.user.email}")
        response_data['message'] = 'No active session found'
        return Response(response_data)

    print(f"[DEBUG] Found active session ID {active_attendance.id} for {request.user.email}")

    # Calculate session duration
    now = timezone.now()
    duration_seconds = (now - active_attendance.clock_in).total_seconds()
    duration_hours = duration_seconds / 3600

    response_data['active_session'] = {
        'id': active_attendance.id,
        'clock_in': active_attendance.clock_in,
        'clock_out': active_attendance.clock_out,
        'status': active_attendance.status,
        'status_display': active_attendance.get_status_display(),
        'late_minutes': active_attendance.late_minutes,
        'overtime_minutes': active_attendance.overtime_minutes,
        'break_start': active_attendance.break_start,
        'break_end': active_attendance.break_end,
        'notes': active_attendance.notes,
        'duration_hours': round(duration_hours, 2),
        'shift': {
            'id': active_attendance.shift.id,
            'shift_date': active_attendance.shift.shift_date,
            'start_time': active_attendance.shift.start_time,
            'end_time': active_attendance.shift.end_time,
            'shift_type': active_attendance.shift.shift_type,
            'shift_type_display': active_attendance.shift.get_shift_type_display(),
        }
    }

    return Response(response_data)
