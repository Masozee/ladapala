from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, Department, Employee, Shift, Attendance


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # List view configuration
    list_display = ['email', 'full_name_display', 'role_badge', 'status_badge', 'date_joined_short']
    list_filter = ['role', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    list_per_page = 25

    # Read-only fields
    readonly_fields = ['date_joined', 'last_login', 'permission_preview']

    # Fieldsets for edit form
    fieldsets = (
        ('🔐 Authentication', {
            'fields': ('email', 'password')
        }),
        ('👤 Personal Information', {
            'fields': ('first_name', 'last_name', 'phone', 'date_of_birth', 'avatar')
        }),
        ('📍 Additional Info', {
            'fields': ('address', 'bio'),
            'classes': ('collapse',)
        }),
        ('🎯 Role & Access', {
            'fields': ('role', 'is_active', 'permission_preview'),
        }),
        ('🔧 Advanced Settings', {
            'fields': ('is_staff', 'is_superuser'),
            'classes': ('collapse',),
            'description': 'These are auto-set based on role. Only modify if needed.'
        }),
        ('📅 Timeline', {
            'fields': ('date_joined', 'last_login', 'last_login_ip'),
            'classes': ('collapse',)
        }),
    )

    # Fieldsets for create form
    add_fieldsets = (
        ('🔐 Account Credentials', {
            'fields': ('email', 'password1', 'password2')
        }),
        ('👤 Basic Information', {
            'fields': ('first_name', 'last_name', 'phone')
        }),
        ('🎯 Role Assignment', {
            'fields': ('role', 'is_active'),
            'description': 'Select appropriate role. Permissions will be set automatically.'
        }),
    )

    # Custom display methods
    def full_name_display(self, obj):
        """Display full name or email if name not set"""
        name = obj.full_name
        if name == obj.email:
            return format_html('<span style="color: #6c757d; font-style: italic;">{}</span>', name)
        return name
    full_name_display.short_description = 'Name'

    def role_badge(self, obj):
        """Display role as a colored badge"""
        colors = {
            'ADMIN': '#dc3545',
            'MANAGER': '#0d6efd',
            'SUPERVISOR': '#6610f2',
            'RECEPTIONIST': '#0dcaf0',
            'HOUSEKEEPING': '#198754',
            'MAINTENANCE': '#fd7e14',
            'STAFF': '#6c757d',
        }
        color = colors.get(obj.role, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">{}</span>',
            color,
            obj.get_role_display()
        )
    role_badge.short_description = 'Role'

    def status_badge(self, obj):
        """Display status badge"""
        if obj.is_active:
            return format_html(
                '<span style="color: #198754; font-weight: 600;">● Active</span>'
            )
        return format_html(
            '<span style="color: #dc3545; font-weight: 600;">● Inactive</span>'
        )
    status_badge.short_description = 'Status'

    def date_joined_short(self, obj):
        """Display date joined in short format"""
        return obj.date_joined.strftime('%d %b %Y')
    date_joined_short.short_description = 'Joined'

    def permission_preview(self, obj):
        """Clean permission display in edit form"""
        html = '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #0d6efd;">'
        html += '<h3 style="margin: 0 0 15px 0; color: #212529; font-size: 16px;">🔐 User Permissions</h3>'

        permissions = [
            ('can_manage_users', '👥', 'Manage Users'),
            ('can_manage_bookings', '📅', 'Manage Bookings'),
            ('can_manage_housekeeping', '🧹', 'Manage Housekeeping'),
            ('can_view_reports', '📊', 'View Reports'),
            ('can_manage_inventory', '📦', 'Manage Inventory'),
        ]

        html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">'
        for method, icon, label in permissions:
            has_perm = getattr(obj, method)()
            status = '✅' if has_perm else '❌'
            opacity = '1' if has_perm else '0.4'
            html += f'<div style="padding: 8px; background: white; border-radius: 4px; opacity: {opacity};">'
            html += f'<span style="font-size: 14px;">{status} {icon} {label}</span>'
            html += '</div>'
        html += '</div>'

        if obj.is_superuser:
            html += '<div style="margin-top: 15px; padding: 12px; background: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">'
            html += '<strong style="color: #856404;">⚡ SUPERUSER</strong><br>'
            html += '<span style="color: #856404; font-size: 13px;">Has all permissions regardless of role</span>'
            html += '</div>'

        html += '</div>'
        return format_html(html)
    permission_preview.short_description = 'Permissions'

    def save_model(self, request, obj, form, change):
        """Auto-adjust is_staff based on role"""
        if obj.role in ['ADMIN', 'MANAGER', 'SUPERVISOR']:
            obj.is_staff = True

        if obj.role == 'ADMIN':
            obj.is_superuser = True
        elif not change:  # Only on create
            obj.is_superuser = False

        super().save_model(request, obj, form, change)

    # Bulk actions
    actions = ['activate_users', 'deactivate_users']

    @admin.action(description='✅ Activate selected users')
    def activate_users(self, request, queryset):
        """Activate selected users"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'✅ {updated} user(s) activated successfully.', 'success')

    @admin.action(description='❌ Deactivate selected users')
    def deactivate_users(self, request, queryset):
        """Deactivate selected users"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'❌ {updated} user(s) deactivated successfully.', 'warning')


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'manager', 'status_badge', 'created_short']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    list_per_page = 25

    fieldsets = (
        ('Department Info', {
            'fields': ('name', 'description', 'manager')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )

    def status_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color: #198754;">● Active</span>')
        return format_html('<span style="color: #dc3545;">● Inactive</span>')
    status_badge.short_description = 'Status'

    def created_short(self, obj):
        return obj.created_at.strftime('%d %b %Y')
    created_short.short_description = 'Created'


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'full_name', 'department', 'position', 'employment_badge', 'hire_date_short']
    list_filter = ['employment_status', 'is_active', 'department', 'hire_date']
    search_fields = ['employee_id', 'first_name', 'last_name', 'email', 'user__email']
    ordering = ['-hire_date']
    list_per_page = 25

    fieldsets = (
        ('🔗 System Link', {
            'fields': ('user',),
            'description': 'Link to user account (optional - only if employee needs system access)'
        }),
        ('👤 Personal Info', {
            'fields': ('employee_id', 'first_name', 'last_name', 'email')
        }),
        ('💼 Employment', {
            'fields': ('department', 'position', 'hire_date', 'termination_date', 'salary', 'employment_status')
        }),
        ('📞 Contact', {
            'fields': ('phone', 'address', 'emergency_contact', 'emergency_phone')
        }),
        ('✅ Status', {
            'fields': ('is_active',)
        }),
    )

    def employment_badge(self, obj):
        colors = {
            'ACTIVE': '#198754',
            'INACTIVE': '#6c757d',
            'TERMINATED': '#dc3545',
            'RESIGNED': '#fd7e14',
        }
        color = colors.get(obj.employment_status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: 600;">● {}</span>',
            color,
            obj.get_employment_status_display()
        )
    employment_badge.short_description = 'Employment'

    def hire_date_short(self, obj):
        return obj.hire_date.strftime('%d %b %Y') if obj.hire_date else '-'
    hire_date_short.short_description = 'Hired'


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ['employee_name', 'shift_date', 'time_range', 'shift_type_badge', 'hours_scheduled']
    list_filter = ['shift_type', 'shift_date']
    search_fields = ['employee__employee_id', 'employee__first_name', 'employee__last_name']
    ordering = ['-shift_date', 'start_time']
    list_per_page = 50

    fieldsets = (
        ('👤 Employee', {
            'fields': ('employee',)
        }),
        ('📅 Schedule', {
            'fields': ('shift_date', 'start_time', 'end_time', 'shift_type', 'break_duration')
        }),
        ('📝 Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )

    def employee_name(self, obj):
        return obj.employee.full_name
    employee_name.short_description = 'Employee'

    def time_range(self, obj):
        return f"{obj.start_time.strftime('%H:%M')} - {obj.end_time.strftime('%H:%M')}"
    time_range.short_description = 'Time'

    def shift_type_badge(self, obj):
        colors = {
            'MORNING': '#0dcaf0',
            'AFTERNOON': '#ffc107',
            'EVENING': '#fd7e14',
            'NIGHT': '#6610f2',
            'OVERTIME': '#dc3545',
        }
        color = colors.get(obj.shift_type, '#6c757d')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 600;">{}</span>',
            color,
            obj.get_shift_type_display()
        )
    shift_type_badge.short_description = 'Type'


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['employee_shift', 'clock_in_time', 'clock_out_time', 'status_badge', 'hours_display']
    list_filter = ['status', 'shift__shift_date']
    search_fields = ['shift__employee__employee_id', 'shift__employee__first_name', 'shift__employee__last_name']
    ordering = ['-shift__shift_date']
    list_per_page = 50

    fieldsets = (
        ('📅 Shift', {
            'fields': ('shift',)
        }),
        ('⏰ Time Tracking', {
            'fields': ('clock_in', 'clock_out', 'break_start', 'break_end')
        }),
        ('📊 Status & Metrics', {
            'fields': ('status', 'late_minutes', 'overtime_minutes')
        }),
        ('📝 Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )

    def employee_shift(self, obj):
        return f"{obj.shift.employee.full_name} - {obj.shift.shift_date}"
    employee_shift.short_description = 'Employee / Date'

    def clock_in_time(self, obj):
        return obj.clock_in.strftime('%H:%M') if obj.clock_in else '-'
    clock_in_time.short_description = 'In'

    def clock_out_time(self, obj):
        return obj.clock_out.strftime('%H:%M') if obj.clock_out else '-'
    clock_out_time.short_description = 'Out'

    def status_badge(self, obj):
        colors = {
            'PRESENT': '#198754',
            'LATE': '#ffc107',
            'ABSENT': '#dc3545',
            'SICK': '#0dcaf0',
            'VACATION': '#6610f2',
            'OVERTIME': '#fd7e14',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="color: {}; font-weight: 600;">● {}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def hours_display(self, obj):
        hours = obj.hours_worked
        if hours > 0:
            return f"{hours:.1f}h"
        return '-'
    hours_display.short_description = 'Hours'
