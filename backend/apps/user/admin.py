from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.db.models import Count, Avg, Sum
from django.urls import reverse
from datetime import date, timedelta
from .models import User, Department, Employee, Shift, Attendance, UserProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    readonly_fields = ('last_login', 'date_joined')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name'),
        }),
    )


class EmployeeInline(admin.TabularInline):
    model = Employee
    extra = 0
    fields = ('user', 'employee_id', 'position', 'salary', 'is_active')
    readonly_fields = ('employee_id',)


class ShiftInline(admin.TabularInline):
    model = Shift
    extra = 0
    fields = ('shift_date', 'shift_type', 'start_time', 'end_time', 'break_duration')
    ordering = ('-shift_date',)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'manager', 'employee_count', 'avg_salary', 'total_payroll', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at', 'employee_count', 'avg_salary', 'total_payroll')
    
    fieldsets = (
        ('Department Information', {
            'fields': ('name', 'description', 'manager', 'is_active')
        }),
        ('Statistics', {
            'fields': ('employee_count', 'avg_salary', 'total_payroll'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [EmployeeInline]
    actions = ['activate_departments', 'deactivate_departments']
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related('manager', 'manager__user').annotate(
            _employee_count=Count('employee', distinct=True),
            _avg_salary=Avg('employee__salary'),
            _total_payroll=Sum('employee__salary')
        )
    
    def employee_count(self, obj):
        count = getattr(obj, '_employee_count', 0)
        if count > 0:
            url = reverse('admin:user_employee_changelist')
            return format_html(
                '<a href="{}?department={}">{} employees</a>',
                url,
                obj.id,
                count
            )
        return '0 employees'
    employee_count.admin_order_field = '_employee_count'
    employee_count.short_description = 'Employees'
    
    def avg_salary(self, obj):
        avg = getattr(obj, '_avg_salary', None)
        if avg is not None and avg > 0:
            try:
                return format_html('${:,.2f}', float(avg))
            except (ValueError, TypeError):
                return '$0.00'
        return '$0.00'
    avg_salary.admin_order_field = '_avg_salary'
    avg_salary.short_description = 'Avg Salary'
    
    def total_payroll(self, obj):
        total = getattr(obj, '_total_payroll', None)
        if total is not None and total > 0:
            try:
                return format_html('<strong>${:,.2f}</strong>', float(total))
            except (ValueError, TypeError):
                return '$0.00'
        return '$0.00'
    total_payroll.admin_order_field = '_total_payroll'
    total_payroll.short_description = 'Total Payroll'
    
    def activate_departments(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'Activated {updated} departments.')
    activate_departments.short_description = 'Activate selected departments'
    
    def deactivate_departments(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'Deactivated {updated} departments.')
    deactivate_departments.short_description = 'Deactivate selected departments'


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'employee_id', 'department_link', 'position', 'salary', 'hire_date', 'attendance_rate', 'total_shifts', 'is_active')
    list_filter = ('department', 'position', 'hire_date', 'is_active', 'created_at')
    search_fields = ('user__first_name', 'user__last_name', 'user__email', 'employee_id', 'position')
    readonly_fields = ('employee_id', 'created_at', 'updated_at', 'full_name', 'attendance_rate', 'total_shifts', 'recent_attendance')
    
    fieldsets = (
        ('Employee Information', {
            'fields': ('user', 'employee_id', 'department', 'position', 'salary', 'hire_date', 'is_active')
        }),
        ('Performance', {
            'fields': ('full_name', 'attendance_rate', 'total_shifts', 'recent_attendance'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ShiftInline]
    actions = ['activate_employees', 'deactivate_employees', 'generate_payroll_report']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'department').annotate(
            _total_shifts=Count('shifts', distinct=True)
        )
    
    def full_name(self, obj):
        try:
            url = reverse('admin:user_user_change', args=[obj.user.id])
            name = obj.user.get_full_name() or obj.user.email
            return format_html(
                '<a href="{}">{}</a>',
                str(url),
                str(name)
            )
        except (ValueError, TypeError, AttributeError):
            return str(obj.user.email) if obj.user else 'Unknown'
    full_name.short_description = 'Full Name'
    full_name.admin_order_field = 'user__first_name'
    
    def department_link(self, obj):
        if obj.department:
            try:
                url = reverse('admin:user_department_change', args=[obj.department.id])
                return format_html(
                    '<a href="{}">{}</a>',
                    str(url),
                    str(obj.department.name)
                )
            except (ValueError, TypeError, AttributeError):
                return str(obj.department.name)
        return 'No Department'
    department_link.short_description = 'Department'
    department_link.admin_order_field = 'department__name'
    
    def attendance_rate(self, obj):
        # Calculate attendance rate for last 30 days
        thirty_days_ago = date.today() - timedelta(days=30)
        total_shifts = obj.shifts.filter(shift_date__gte=thirty_days_ago).count()
        present_shifts = obj.shifts.filter(shift_date__gte=thirty_days_ago, attendance__clock_in__isnull=False).count()
        
        if total_shifts > 0:
            try:
                rate = (present_shifts / total_shifts) * 100
                color = 'green' if rate >= 90 else 'orange' if rate >= 75 else 'red'
                return format_html(
                    '<span style="color: {}; font-weight: bold;">{:.1f}%</span>',
                    str(color), float(rate)
                )
            except (ValueError, TypeError):
                return 'N/A'
        return 'N/A'
    attendance_rate.short_description = 'Attendance (30d)'
    
    def total_shifts(self, obj):
        count = getattr(obj, '_total_shifts', 0)
        if count > 0:
            try:
                url = reverse('admin:user_shift_changelist')
                return format_html(
                    '<a href="{}?employee={}">{} shifts</a>',
                    str(url),
                    obj.id,
                    count
                )
            except (ValueError, TypeError):
                return f'{count} shifts'
        return '0 shifts'
    total_shifts.admin_order_field = '_total_shifts'
    total_shifts.short_description = 'Total Shifts'
    
    def recent_attendance(self, obj):
        recent = obj.shifts.filter(shift_date__gte=date.today()-timedelta(days=7))
        if recent.exists():
            present = recent.filter(attendance__clock_in__isnull=False).count()
            total = recent.count()
            return f'{present}/{total} days'
        return 'No recent data'
    recent_attendance.short_description = 'Recent (7d)'
    
    def activate_employees(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'Activated {updated} employees.')
    activate_employees.short_description = 'Activate selected employees'
    
    def deactivate_employees(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'Deactivated {updated} employees.')
    deactivate_employees.short_description = 'Deactivate selected employees'
    
    def generate_payroll_report(self, request, queryset):
        total_salary = sum(float(emp.salary) for emp in queryset)
        self.message_user(request, f'Total payroll for {queryset.count()} employees: ${total_salary:,.2f}')
    generate_payroll_report.short_description = 'Calculate payroll total'


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'shift_type', 'start_time', 'end_time', 'duration', 'break_duration', 'employee')
    list_filter = ('shift_type', 'shift_date', 'start_time', 'end_time', 'created_at')
    search_fields = ('employee__user__first_name', 'employee__user__last_name', 'employee__user__email', 'notes')
    readonly_fields = ('created_at', 'updated_at', 'duration')
    
    fieldsets = (
        ('Shift Information', {
            'fields': ('employee', 'shift_date', 'shift_type', 'start_time', 'end_time', 'break_duration')
        }),
        ('Statistics', {
            'fields': ('duration',),
            'classes': ('collapse',)
        }),
        ('Additional Info', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_overtime', 'duplicate_shifts']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('employee', 'employee__user')
    
    def duration(self, obj):
        hours = obj.hours_scheduled
        return f'{hours:.1f} hours'
    duration.short_description = 'Duration'
    
    def mark_overtime(self, request, queryset):
        updated = queryset.update(shift_type='OVERTIME')
        self.message_user(request, f'Marked {updated} shifts as overtime.')
    mark_overtime.short_description = 'Mark as overtime shifts'
    
    def duplicate_shifts(self, request, queryset):
        self.message_user(request, f'Shift duplication functionality for {queryset.count()} shifts.')
    duplicate_shifts.short_description = 'Duplicate selected shifts'


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee_link', 'shift_date', 'shift_link', 'clock_in_time', 'clock_out_time', 'hours_worked', 'status_badge', 'late_minutes', 'overtime_minutes')
    list_filter = ('shift__shift_date', 'status', 'shift__employee__department')
    search_fields = ('shift__employee__user__first_name', 'shift__employee__user__last_name', 'shift__employee__user__email', 'shift__employee__employee_id')
    readonly_fields = ('hours_worked', 'status_badge')
    date_hierarchy = 'shift__shift_date'
    
    fieldsets = (
        ('Attendance Information', {
            'fields': ('shift', 'status')
        }),
        ('Time Tracking', {
            'fields': ('clock_in', 'clock_out', 'break_start', 'break_end')
        }),
        ('Calculations', {
            'fields': ('hours_worked', 'late_minutes', 'overtime_minutes', 'status_badge')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_present', 'calculate_overtime', 'export_timesheet']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('shift', 'shift__employee', 'shift__employee__user', 'shift__employee__department')
    
    def employee_link(self, obj):
        try:
            url = reverse('admin:user_employee_change', args=[obj.shift.employee.id])
            name = obj.shift.employee.user.get_full_name() or obj.shift.employee.user.email
            return format_html(
                '<a href="{}">{} ({})</a>',
                str(url),
                str(name),
                str(obj.shift.employee.employee_id)
            )
        except (ValueError, TypeError, AttributeError):
            return str(obj.shift.employee.employee_id) if obj.shift and obj.shift.employee else 'Unknown'
    employee_link.short_description = 'Employee'
    employee_link.admin_order_field = 'shift__employee__user__first_name'
    
    def shift_link(self, obj):
        try:
            url = reverse('admin:user_shift_change', args=[obj.shift.id])
            return format_html(
                '<a href="{}">{}</a>',
                str(url),
                str(obj.shift.shift_type)
            )
        except (ValueError, TypeError, AttributeError):
            return str(obj.shift.shift_type) if obj.shift else 'Unknown'
    shift_link.short_description = 'Shift'
    shift_link.admin_order_field = 'shift__shift_type'
    
    def shift_date(self, obj):
        return obj.shift.shift_date
    shift_date.short_description = 'Date'
    shift_date.admin_order_field = 'shift__shift_date'
    
    def clock_in_time(self, obj):
        if obj.clock_in:
            return obj.clock_in.strftime('%H:%M')
        return '—'
    clock_in_time.short_description = 'Clock In'
    clock_in_time.admin_order_field = 'clock_in'
    
    def clock_out_time(self, obj):
        if obj.clock_out:
            return obj.clock_out.strftime('%H:%M')
        return '—'
    clock_out_time.short_description = 'Clock Out'
    clock_out_time.admin_order_field = 'clock_out'
    
    def status_badge(self, obj):
        if obj.clock_in and obj.clock_out:
            if obj.late_minutes and obj.late_minutes > 0:
                return format_html('<span style="color: orange; font-weight: bold;">⚠️ Present (Late)</span>')
            else:
                return format_html('<span style="color: green; font-weight: bold;">✅ Present</span>')
        elif obj.clock_in:
            return format_html('<span style="color: blue; font-weight: bold;">🔄 Clocked In</span>')
        else:
            return format_html('<span style="color: red; font-weight: bold;">❌ Absent</span>')
    status_badge.short_description = 'Status'
    
    def mark_present(self, request, queryset):
        from datetime import datetime
        now = datetime.now().time()
        updated = 0
        for attendance in queryset.filter(clock_in__isnull=True):
            attendance.clock_in = now
            attendance.save()
            updated += 1
        self.message_user(request, f'Marked {updated} attendances as present.')
    mark_present.short_description = 'Mark as present (clock in now)'
    
    def calculate_overtime(self, request, queryset):
        overtime_count = queryset.filter(hours_worked__gt=8).count()
        self.message_user(request, f'{overtime_count} attendances have overtime hours.')
    calculate_overtime.short_description = 'Calculate overtime'
    
    def export_timesheet(self, request, queryset):
        total_hours = sum((att.hours_worked.total_seconds() / 3600) for att in queryset if att.hours_worked)
        self.message_user(request, f'Total hours for {queryset.count()} records: {total_hours:.2f} hours.')
    export_timesheet.short_description = 'Calculate total hours'


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'system_access', 'user_active', 'last_login_ip']
    list_filter = ['role', 'system_access', 'user__is_active']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'bio']
    readonly_fields = ['last_login_ip', 'created_at', 'updated_at']
    
    def user_active(self, obj):
        return obj.user.is_active
    user_active.boolean = True
    user_active.short_description = 'Active'
