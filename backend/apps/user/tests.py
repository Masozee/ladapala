from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from datetime import date, time, datetime, timedelta
from decimal import Decimal
from .models import Department, Employee, Shift, Attendance


class DepartmentModelTest(TestCase):
    def test_create_department(self):
        """Test creating department"""
        department = Department.objects.create(
            name='Front Desk',
            description='Reception and guest services'
        )
        self.assertEqual(department.name, 'Front Desk')
        self.assertTrue(department.is_active)


class EmployeeModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='john.doe',
            first_name='John',
            last_name='Doe',
            email='john@hotel.com'
        )
        self.department = Department.objects.create(name='Housekeeping')

    def test_create_employee(self):
        """Test creating employee"""
        employee = Employee.objects.create(
            user=self.user,
            employee_id='EMP001',
            department=self.department,
            position='Room Attendant',
            salary=Decimal('5000000.00'),
            hire_date=date.today()
        )
        self.assertEqual(employee.employee_id, 'EMP001')
        self.assertEqual(employee.department, self.department)
        self.assertEqual(employee.salary, Decimal('5000000.00'))
        self.assertTrue(employee.is_active)

    def test_employee_str_representation(self):
        """Test string representation of employee"""
        employee = Employee.objects.create(
            user=self.user,
            employee_id='EMP001',
            department=self.department
        )
        self.assertEqual(str(employee), 'EMP001 - John Doe')

    def test_employee_full_name(self):
        """Test employee full name property"""
        employee = Employee.objects.create(
            user=self.user,
            employee_id='EMP001',
            department=self.department
        )
        self.assertEqual(employee.full_name, 'John Doe')


class ShiftModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='jane.doe',
            first_name='Jane',
            last_name='Doe'
        )
        self.department = Department.objects.create(name='Front Desk')
        self.employee = Employee.objects.create(
            user=self.user,
            employee_id='EMP002',
            department=self.department
        )

    def test_create_shift(self):
        """Test creating shift"""
        shift = Shift.objects.create(
            employee=self.employee,
            shift_date=date.today(),
            start_time=time(8, 0),
            end_time=time(16, 0),
            shift_type='MORNING'
        )
        self.assertEqual(shift.employee, self.employee)
        self.assertEqual(shift.shift_type, 'MORNING')
        self.assertEqual(shift.hours_scheduled, 7.0)  # 8 hours - 1 hour break

    def test_shift_hours_calculation(self):
        """Test shift hours calculation"""
        shift = Shift.objects.create(
            employee=self.employee,
            shift_date=date.today(),
            start_time=time(14, 0),
            end_time=time(22, 0)
        )
        self.assertEqual(shift.hours_scheduled, 7.0)  # 8 hours - 1 hour break

    def test_overnight_shift_hours(self):
        """Test overnight shift hours calculation"""
        shift = Shift.objects.create(
            employee=self.employee,
            shift_date=date.today(),
            start_time=time(22, 0),
            end_time=time(6, 0)
        )
        self.assertEqual(shift.hours_scheduled, 7.0)  # 8 hours - 1 hour break

    def test_shift_str_representation(self):
        """Test string representation of shift"""
        shift = Shift.objects.create(
            employee=self.employee,
            shift_date=date.today(),
            start_time=time(8, 0),
            end_time=time(16, 0)
        )
        expected = f"Jane Doe - {date.today()} (08:00-16:00)"
        self.assertEqual(str(shift), expected)


class AttendanceModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='bob.smith',
            first_name='Bob',
            last_name='Smith'
        )
        self.department = Department.objects.create(name='Security')
        self.employee = Employee.objects.create(
            user=self.user,
            employee_id='EMP003',
            department=self.department
        )
        self.shift = Shift.objects.create(
            employee=self.employee,
            shift_date=date.today(),
            start_time=time(9, 0),
            end_time=time(17, 0)
        )

    def test_create_attendance(self):
        """Test creating attendance record"""
        attendance = Attendance.objects.create(
            shift=self.shift,
            clock_in=datetime.combine(date.today(), time(9, 0)),
            clock_out=datetime.combine(date.today(), time(17, 0)),
            status='PRESENT'
        )
        self.assertEqual(attendance.shift, self.shift)
        self.assertEqual(attendance.status, 'PRESENT')
        self.assertEqual(attendance.hours_worked, 8.0)

    def test_late_attendance(self):
        """Test late attendance detection"""
        attendance = Attendance.objects.create(
            shift=self.shift,
            clock_in=datetime.combine(date.today(), time(9, 30)),
            clock_out=datetime.combine(date.today(), time(17, 0)),
            status='LATE'
        )
        self.assertTrue(attendance.is_late())
        self.assertEqual(attendance.late_minutes, 30)

    def test_early_departure(self):
        """Test early departure detection"""
        attendance = Attendance.objects.create(
            shift=self.shift,
            clock_in=datetime.combine(date.today(), time(9, 0)),
            clock_out=datetime.combine(date.today(), time(16, 30))
        )
        self.assertTrue(attendance.is_early_departure())

    def test_attendance_str_representation(self):
        """Test string representation of attendance"""
        attendance = Attendance.objects.create(
            shift=self.shift,
            clock_in=datetime.combine(date.today(), time(9, 0)),
            status='PRESENT'
        )
        expected = f"Bob Smith - {date.today()} - PRESENT"
        self.assertEqual(str(attendance), expected)
