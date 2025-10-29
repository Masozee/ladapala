from rest_framework import serializers
from .models import User, Department, Employee, Shift, Attendance


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User (merged with profile)"""
    full_name = serializers.CharField(read_only=True)
    avatar_url = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'phone', 'address', 'date_of_birth', 'bio',
            'avatar', 'avatar_url',
            'is_staff', 'is_superuser', 'is_active',
            'date_joined', 'last_login'
        ]
        read_only_fields = ['email', 'is_staff', 'is_superuser', 'date_joined', 'last_login']

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user info"""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'bio', 'address', 'date_of_birth', 'avatar', 'role']


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department"""
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'manager', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class EmployeeSerializer(serializers.ModelSerializer):
    """Serializer for Employee with unified User data"""
    # User fields exposed as read-only properties
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    address = serializers.CharField(source='user.address', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    role_display = serializers.CharField(source='user.get_role_display', read_only=True)
    avatar_url = serializers.SerializerMethodField()

    # Department info
    department_name = serializers.CharField(source='department.name', read_only=True)

    # Employment status display
    employment_status_display = serializers.CharField(source='get_employment_status_display', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'user',
            # User fields
            'full_name', 'first_name', 'last_name', 'email', 'phone', 'address',
            'role', 'role_display', 'avatar_url',
            # Employment fields
            'department', 'department_name', 'position', 'salary',
            'hire_date', 'termination_date',
            'emergency_contact', 'emergency_phone', 'emergency_relationship',
            'employment_status', 'employment_status_display',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['employee_id', 'created_at', 'updated_at']

    def get_avatar_url(self, obj):
        if obj.user.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.avatar.url)
        return None


class ShiftSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_display = serializers.CharField(source='employee.employee_id', read_only=True)
    shift_type_display = serializers.CharField(source='get_shift_type_display', read_only=True)
    hours_scheduled = serializers.ReadOnlyField()
    has_attendance = serializers.SerializerMethodField()

    class Meta:
        model = Shift
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_display', 'shift_date',
            'start_time', 'end_time', 'shift_type', 'shift_type_display',
            'break_duration', 'hours_scheduled', 'has_attendance', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'hours_scheduled']

    def get_has_attendance(self, obj):
        """Check if attendance record exists for this shift"""
        try:
            return obj.attendance is not None
        except:
            return False


class AttendanceSerializer(serializers.ModelSerializer):
    """Serializer for Attendance records"""
    employee_name = serializers.CharField(source='shift.employee.full_name', read_only=True)
    employee_id = serializers.CharField(source='shift.employee.employee_id', read_only=True)
    shift_date = serializers.DateField(source='shift.shift_date', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    hours_worked = serializers.ReadOnlyField()

    class Meta:
        model = Attendance
        fields = [
            'id', 'shift', 'employee_name', 'employee_id', 'shift_date',
            'clock_in', 'clock_out', 'status', 'status_display',
            'late_minutes', 'overtime_minutes', 'hours_worked',
            'break_start', 'break_end', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'hours_worked', 'late_minutes']
