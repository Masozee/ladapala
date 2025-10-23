from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, Department, Employee, Shift, Attendance


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined']
    list_filter = ['is_staff', 'is_active', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'is_staff', 'is_active')}
        ),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'phone', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'phone']
    ordering = ['-created_at']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'manager', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'full_name', 'department', 'position', 'employment_status', 'hire_date', 'is_active']
    list_filter = ['employment_status', 'is_active', 'department', 'hire_date']
    search_fields = ['employee_id', 'first_name', 'last_name', 'email', 'user__email']
    ordering = ['-hire_date']

    fieldsets = (
        ('Basic Info', {'fields': ('user', 'employee_id', 'first_name', 'last_name', 'email')}),
        ('Employment', {'fields': ('department', 'position', 'hire_date', 'termination_date', 'salary', 'employment_status')}),
        ('Contact', {'fields': ('phone', 'address', 'emergency_contact', 'emergency_phone')}),
        ('Status', {'fields': ('is_active',)}),
    )


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ['employee', 'shift_date', 'start_time', 'end_time', 'shift_type', 'hours_scheduled']
    list_filter = ['shift_type', 'shift_date']
    search_fields = ['employee__employee_id', 'employee__first_name', 'employee__last_name']
    ordering = ['-shift_date', 'start_time']


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['shift', 'clock_in', 'clock_out', 'status', 'late_minutes', 'hours_worked']
    list_filter = ['status', 'shift__shift_date']
    search_fields = ['shift__employee__employee_id', 'shift__employee__first_name', 'shift__employee__last_name']
    ordering = ['-shift__shift_date']
