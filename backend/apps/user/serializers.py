from rest_framework import serializers
from django.db.models import Avg, Count
from .models import Department, Employee, Attendance, Shift


class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()
    average_salary = serializers.SerializerMethodField()
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'description', 'manager', 'manager_name', 'budget',
            'is_active', 'created_at', 'updated_at', 'employee_count', 'average_salary'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_employee_count(self, obj):
        """Get total number of employees in department"""
        return obj.employee_set.filter(is_active=True).count()

    def get_average_salary(self, obj):
        """Get average salary in department"""
        avg_salary = obj.employee_set.filter(is_active=True).aggregate(
            avg_salary=Avg('salary')
        )['avg_salary']
        return float(avg_salary) if avg_salary else 0.0


class ShiftSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.user.get_full_name', read_only=True)
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


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)
    position_display = serializers.CharField(source='get_position_display', read_only=True)
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    years_of_service = serializers.SerializerMethodField()
    attendance_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'full_name', 'email',
            'phone', 'department', 'department_name', 'position', 'position_display',
            'shift', 'shift_name', 'hire_date', 'salary', 'employment_type',
            'employment_type_display', 'is_active', 'address', 'emergency_contact_name',
            'emergency_contact_phone', 'created_at', 'updated_at', 'years_of_service',
            'attendance_rate'
        ]
        read_only_fields = ['employee_id', 'created_at', 'updated_at', 'full_name']

    def get_years_of_service(self, obj):
        """Calculate years of service"""
        from django.utils import timezone
        if obj.hire_date:
            delta = timezone.now().date() - obj.hire_date
            return round(delta.days / 365.25, 1)
        return 0

    def get_attendance_rate(self, obj):
        """Calculate attendance rate for last 30 days"""
        from django.utils import timezone
        from datetime import timedelta
        
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        total_days = obj.attendance_set.filter(date__gte=thirty_days_ago).count()
        present_days = obj.attendance_set.filter(
            date__gte=thirty_days_ago,
            status='PRESENT'
        ).count()
        
        if total_days == 0:
            return 100.0
        
        return round((present_days / total_days) * 100, 1)


class EmployeeListSerializer(serializers.ModelSerializer):
    """Simplified serializer for employee listings"""
    full_name = serializers.CharField(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    position_display = serializers.CharField(source='get_position_display', read_only=True)
    
    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'full_name', 'email', 'phone',
            'department_name', 'position_display', 'hire_date',
            'is_active'
        ]


class EmployeeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating employees"""
    class Meta:
        model = Employee
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'department',
            'position', 'shift', 'hire_date', 'salary', 'employment_type',
            'address', 'emergency_contact_name', 'emergency_contact_phone'
        ]

    def validate_email(self, value):
        """Validate email uniqueness"""
        if self.instance:
            if Employee.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
                raise serializers.ValidationError("Employee with this email already exists.")
        else:
            if Employee.objects.filter(email=value).exists():
                raise serializers.ValidationError("Employee with this email already exists.")
        return value


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='shift.employee.user.get_full_name', read_only=True)
    employee_id_display = serializers.CharField(source='shift.employee.employee_id', read_only=True)
    shift_date = serializers.DateField(source='shift.shift_date', read_only=True)
    scheduled_start = serializers.TimeField(source='shift.start_time', read_only=True)
    scheduled_end = serializers.TimeField(source='shift.end_time', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    hours_worked = serializers.ReadOnlyField()
    
    class Meta:
        model = Attendance
        fields = [
            'id', 'shift', 'employee_name', 'employee_id_display', 'shift_date',
            'scheduled_start', 'scheduled_end', 'clock_in', 'clock_out', 'status', 
            'status_display', 'late_minutes', 'overtime_minutes', 'hours_worked', 
            'break_start', 'break_end', 'notes', 'created_at'
        ]
        read_only_fields = ['created_at', 'hours_worked']


class AttendanceCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating attendance records"""
    class Meta:
        model = Attendance
        fields = [
            'shift', 'clock_in', 'clock_out', 'status', 'late_minutes', 
            'overtime_minutes', 'break_start', 'break_end', 'notes'
        ]

    def validate(self, data):
        """Validate attendance data"""
        clock_in = data.get('clock_in')
        clock_out = data.get('clock_out')
        
        if clock_in and clock_out:
            # Check if shift is too long (more than 16 hours)
            duration = clock_out - clock_in
            if duration.total_seconds() > 16 * 3600:
                raise serializers.ValidationError(
                    "Shift duration cannot exceed 16 hours. Please verify times."
                )
            
            # Clock out must be after clock in
            if clock_out <= clock_in:
                raise serializers.ValidationError(
                    "Clock out time must be after clock in time."
                )
        
        return data


class AttendanceSummarySerializer(serializers.Serializer):
    """Serializer for attendance summary statistics"""
    date = serializers.DateField()
    total_employees = serializers.IntegerField()
    present = serializers.IntegerField()
    absent = serializers.IntegerField()
    late = serializers.IntegerField()
    on_leave = serializers.IntegerField()
    attendance_rate = serializers.FloatField()


class EmployeePerformanceSerializer(serializers.Serializer):
    """Serializer for employee performance metrics"""
    employee_id = serializers.CharField()
    employee_name = serializers.CharField()
    department = serializers.CharField()
    attendance_rate = serializers.FloatField()
    punctuality_rate = serializers.FloatField()
    average_hours_per_day = serializers.FloatField()
    total_days_worked = serializers.IntegerField()
    late_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()