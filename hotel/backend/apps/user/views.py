from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from .serializers import (
    UserSerializer, UserUpdateSerializer,
    ShiftSerializer, EmployeeSerializer, DepartmentSerializer
)
from .models import Shift, User, Employee, Department
from django.db import transaction
from datetime import date


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

        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.full_name,
                'role': user.role,
                'phone': user.phone,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            },
            'employee': employee_info,
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

        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'full_name': request.user.full_name,
                'role': request.user.role,
                'phone': request.user.phone,
                'is_staff': request.user.is_staff,
                'is_superuser': request.is_superuser,
            },
            'employee': employee_info,
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

        return Response({
            'user': {
                'id': request.user.id,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'full_name': request.user.full_name,
                'role': request.user.role,
                'phone': request.user.phone,
                'bio': request.user.bio,
                'address': request.user.address,
                'date_of_birth': request.user.date_of_birth,
                'avatar': request.build_absolute_uri(request.user.avatar.url) if request.user.avatar else None,
                'is_staff': request.user.is_staff,
                'is_superuser': request.user.is_superuser,
            },
            'employee': employee_info,
        })

    elif request.method in ['PUT', 'PATCH']:
        # Update user (profile fields are now in User model)
        with transaction.atomic():
            user_data = {
                'first_name': request.data.get('first_name', request.user.first_name),
                'last_name': request.data.get('last_name', request.user.last_name),
                'phone': request.data.get('phone', request.user.phone),
                'bio': request.data.get('bio', request.user.bio),
                'address': request.data.get('address', request.user.address),
                'date_of_birth': request.data.get('date_of_birth', request.user.date_of_birth),
            }

            # Handle avatar upload if present
            if 'avatar' in request.FILES:
                user_data['avatar'] = request.FILES['avatar']

            user_serializer = UserUpdateSerializer(request.user, data=user_data, partial=True)
            if user_serializer.is_valid():
                user_serializer.save()
            else:
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Update employee emergency contact if employee exists
            if hasattr(request.user, 'employee'):
                employee = request.user.employee
                if 'emergency_contact' in request.data:
                    employee.emergency_contact = request.data.get('emergency_contact')
                if 'emergency_phone' in request.data:
                    employee.emergency_phone = request.data.get('emergency_phone')
                employee.save()

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


@api_view(['GET'])
def department_choices(request):
    """Get available department choices"""
    departments = [
        {'id': 'front_office', 'name': 'Front Office'},
        {'id': 'housekeeping', 'name': 'Housekeeping'},
        {'id': 'food_beverage', 'name': 'Food & Beverage'},
        {'id': 'maintenance', 'name': 'Maintenance'},
        {'id': 'management', 'name': 'Management'},
    ]
    return Response(departments)


@api_view(['GET'])
def role_choices(request):
    """Get available role choices"""
    roles = [{'id': choice[0], 'name': choice[1]} for choice in User.ROLE_CHOICES]
    return Response(roles)


@api_view(['GET', 'POST'])
def manage_users(request):
    """List all users or create a new user"""
    if request.method == 'GET':
        # List all users with their profiles and employees
        from .serializers import UserSerializer
        users = User.objects.all().order_by('-date_joined')
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        # Create new user
        from django.db import transaction
        from .models import Department, Employee

        try:
            with transaction.atomic():
                # Validate required fields
                email = request.data.get('email')
                password = request.data.get('password')
                first_name = request.data.get('first_name', '')
                last_name = request.data.get('last_name', '')
                role = request.data.get('role', 'STAFF')
                department_id = request.data.get('department')
                position = request.data.get('position', '')
                phone = request.data.get('phone', '')
                address = request.data.get('address', '')
                date_of_birth = request.data.get('date_of_birth')

                if not email or not password:
                    return Response(
                        {'error': 'Email and password are required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Check if user exists
                if User.objects.filter(email=email).exists():
                    return Response(
                        {'error': 'User with this email already exists'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Create user with all fields
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    role=role,
                    phone=phone,
                    address=address,
                    date_of_birth=date_of_birth if date_of_birth else None,
                    is_active=True
                )

                # Set staff permissions for admin/manager/supervisor
                if role in ['ADMIN', 'MANAGER', 'SUPERVISOR']:
                    user.is_staff = True
                    if role == 'ADMIN':
                        user.is_superuser = True
                    user.save()

                # Get or create department
                if department_id:
                    # Check if department_id is a numeric ID (from frontend form)
                    try:
                        department = Department.objects.get(id=int(department_id))
                    except (ValueError, Department.DoesNotExist):
                        # If not numeric or not found, try string mapping
                        dept_mapping = {
                            'front_office': 'Front Office',
                            'housekeeping': 'Housekeeping',
                            'food_beverage': 'Food & Beverage',
                            'maintenance': 'Maintenance',
                            'management': 'Management',
                        }

                        dept_name = dept_mapping.get(department_id, department_id)
                        department, _ = Department.objects.get_or_create(
                            name=dept_name,
                            defaults={'description': f'{dept_name} Department'}
                        )

                    # Create employee record with all fields
                    employee = Employee.objects.create(
                        user=user,
                        department=department,
                        position=position or role.title(),
                        hire_date=request.data.get('hire_date', date.today()),
                        salary=request.data.get('salary', 0),
                        emergency_contact=request.data.get('emergency_contact', ''),
                        emergency_phone=request.data.get('emergency_phone', ''),
                        emergency_relationship=request.data.get('emergency_relationship', ''),
                        is_active=True
                    )

                return Response({
                    'message': 'User created successfully',
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'full_name': user.full_name,
                        'role': role,
                    }
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET', 'PUT', 'DELETE'])
def manage_user_detail(request, user_id):
    """Get, update, or delete a specific user"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        from .serializers import UserSerializer
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PUT':
        from django.db import transaction
        from .models import Department, Employee

        try:
            with transaction.atomic():
                # Update user basic info and role
                user.first_name = request.data.get('first_name', user.first_name)
                user.last_name = request.data.get('last_name', user.last_name)
                user.is_active = request.data.get('is_active', user.is_active)
                user.role = request.data.get('role', user.role)
                user.phone = request.data.get('phone', user.phone)

                # Update password if provided
                new_password = request.data.get('password')
                if new_password:
                    user.set_password(new_password)

                # Update staff permissions based on role
                if user.role in ['ADMIN', 'MANAGER', 'SUPERVISOR']:
                    user.is_staff = True
                    if user.role == 'ADMIN':
                        user.is_superuser = True
                    else:
                        user.is_superuser = False
                else:
                    user.is_staff = False
                    user.is_superuser = False

                user.save()

                # Update employee
                if hasattr(user, 'employee'):
                    employee = user.employee
                    employee.position = request.data.get('position', employee.position)
                    employee.salary = request.data.get('salary', employee.salary)
                    employee.save()

                return Response({
                    'message': 'User updated successfully',
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'full_name': user.full_name,
                    }
                })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    elif request.method == 'DELETE':
        # Soft delete - deactivate instead of deleting
        user.is_active = False
        user.save()

        if hasattr(user, 'employee'):
            user.employee.is_active = False
            user.employee.employment_status = 'TERMINATED'
            user.employee.save()

        return Response({
            'message': 'User deactivated successfully'
        })


class EmployeeViewSet(viewsets.ModelViewSet):
    """ViewSet for Employee management"""
    queryset = Employee.objects.all().select_related('user', 'department').order_by('employee_id')
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter employees based on query parameters"""
        queryset = super().get_queryset()

        # Filter by department
        department_id = self.request.query_params.get('department')
        if department_id:
            queryset = queryset.filter(department_id=department_id)

        # Filter by role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(user__role=role)

        # Filter by employment status
        employment_status = self.request.query_params.get('employment_status')
        if employment_status:
            queryset = queryset.filter(employment_status=employment_status)

        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # Search by name or employee ID
        from django.db import models as django_models
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                django_models.Q(employee_id__icontains=search) |
                django_models.Q(user__first_name__icontains=search) |
                django_models.Q(user__last_name__icontains=search) |
                django_models.Q(user__email__icontains=search)
            )

        return queryset

    def update(self, request, *args, **kwargs):
        """Update employee and related user data"""
        from django.db import transaction

        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        with transaction.atomic():
            # Update User fields
            user = instance.user
            if 'first_name' in request.data:
                user.first_name = request.data['first_name']
            if 'last_name' in request.data:
                user.last_name = request.data['last_name']
            if 'phone' in request.data:
                user.phone = request.data['phone']
            if 'address' in request.data:
                user.address = request.data['address']
            if 'date_of_birth' in request.data:
                user.date_of_birth = request.data['date_of_birth'] if request.data['date_of_birth'] else None
            user.save()

            # Update Employee fields
            if 'department' in request.data:
                instance.department_id = request.data['department']
            if 'position' in request.data:
                instance.position = request.data['position']
            if 'salary' in request.data:
                instance.salary = request.data['salary'] if request.data['salary'] else 0
            if 'emergency_contact' in request.data:
                instance.emergency_contact = request.data['emergency_contact']
            if 'emergency_phone' in request.data:
                instance.emergency_phone = request.data['emergency_phone']
            if 'emergency_relationship' in request.data:
                instance.emergency_relationship = request.data['emergency_relationship']
            instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get employee statistics"""
        from django.db.models import Count, Q

        total = Employee.objects.count()
        active = Employee.objects.filter(is_active=True, employment_status='ACTIVE').count()
        on_leave = 0  # Will be calculated from attendance/leave records
        new_this_month = Employee.objects.filter(
            hire_date__year=date.today().year,
            hire_date__month=date.today().month
        ).count()

        return Response({
            'total_employees': total,
            'active_employees': active,
            'on_leave': on_leave,
            'new_this_month': new_this_month,
        })


class DepartmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Department management"""
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]


class ShiftViewSet(viewsets.ModelViewSet):
    """ViewSet for Shift management"""
    queryset = Shift.objects.all().select_related('employee', 'employee__user', 'employee__department').order_by('-shift_date', 'start_time')
    serializer_class = ShiftSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter shifts based on query parameters"""
        queryset = super().get_queryset()

        # Filter by date range
        from_date = self.request.query_params.get('from_date')
        to_date = self.request.query_params.get('to_date')

        if from_date:
            queryset = queryset.filter(shift_date__gte=from_date)
        if to_date:
            queryset = queryset.filter(shift_date__lte=to_date)

        # Filter by employee
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        # Filter by shift type
        shift_type = self.request.query_params.get('shift_type')
        if shift_type:
            queryset = queryset.filter(shift_type=shift_type)

        return queryset
