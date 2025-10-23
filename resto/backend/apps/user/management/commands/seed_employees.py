from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from decimal import Decimal
from datetime import date, time, timedelta, datetime
import random
from apps.employees.models import Department, Employee, Shift, Attendance


class Command(BaseCommand):
    help = 'Create seed data for employees app with Indonesian hotel context'

    def handle(self, *args, **options):
        self.stdout.write('Creating seed data for employees...')
        
        with transaction.atomic():
            # Create departments typical for Indonesian hotels
            departments_data = [
                {
                    'name': 'Front Office',
                    'description': 'Departemen front office yang menangani check-in, check-out, dan layanan tamu',
                    'is_active': True
                },
                {
                    'name': 'Housekeeping',
                    'description': 'Departemen housekeeping untuk kebersihan kamar dan area umum',
                    'is_active': True
                },
                {
                    'name': 'Food & Beverage',
                    'description': 'Departemen makanan dan minuman termasuk restoran dan room service',
                    'is_active': True
                },
                {
                    'name': 'Engineering',
                    'description': 'Departemen teknik untuk maintenance dan perbaikan fasilitas hotel',
                    'is_active': True
                },
                {
                    'name': 'Security',
                    'description': 'Departemen keamanan hotel 24 jam',
                    'is_active': True
                },
                {
                    'name': 'Human Resources',
                    'description': 'Departemen SDM untuk pengelolaan karyawan',
                    'is_active': True
                },
                {
                    'name': 'Finance & Accounting',
                    'description': 'Departemen keuangan dan akuntansi',
                    'is_active': True
                },
                {
                    'name': 'Sales & Marketing',
                    'description': 'Departemen penjualan dan pemasaran',
                    'is_active': True
                }
            ]

            # Create departments
            created_departments = []
            for dept_data in departments_data:
                department, created = Department.objects.get_or_create(
                    name=dept_data['name'],
                    defaults=dept_data
                )
                if created:
                    created_departments.append(department)
                    self.stdout.write(f'Created department: {department.name}')

            # Create users and employees with Indonesian names and context
            employees_data = [
                # Front Office
                {
                    'username': 'rina.receptionist',
                    'first_name': 'Rina',
                    'last_name': 'Sari',
                    'email': 'rina.sari@hotel.com',
                    'department': 'Front Office',
                    'position': 'Receptionist',
                    'salary': Decimal('4500000.00'),  # 4.5 million IDR
                    'hire_date': date(2022, 3, 1)
                },
                {
                    'username': 'dani.frontoffice',
                    'first_name': 'Dani',
                    'last_name': 'Pratama',
                    'email': 'dani.pratama@hotel.com',
                    'department': 'Front Office',
                    'position': 'Front Office Supervisor',
                    'salary': Decimal('7000000.00'),  # 7 million IDR
                    'hire_date': date(2021, 1, 15)
                },
                {
                    'username': 'siti.concierge',
                    'first_name': 'Siti',
                    'last_name': 'Nurhaliza',
                    'email': 'siti.nurhaliza@hotel.com',
                    'department': 'Front Office',
                    'position': 'Concierge',
                    'salary': Decimal('5500000.00'),  # 5.5 million IDR
                    'hire_date': date(2022, 8, 10)
                },
                # Housekeeping
                {
                    'username': 'dewi.housekeeper',
                    'first_name': 'Dewi',
                    'last_name': 'Lestari',
                    'email': 'dewi.lestari@hotel.com',
                    'department': 'Housekeeping',
                    'position': 'Room Attendant',
                    'salary': Decimal('3800000.00'),  # 3.8 million IDR
                    'hire_date': date(2021, 6, 20)
                },
                {
                    'username': 'ibu.mira',
                    'first_name': 'Mira',
                    'last_name': 'Kusuma',
                    'email': 'mira.kusuma@hotel.com',
                    'department': 'Housekeeping',
                    'position': 'Housekeeping Supervisor',
                    'salary': Decimal('6500000.00'),  # 6.5 million IDR
                    'hire_date': date(2020, 4, 1)
                },
                {
                    'username': 'yuni.laundry',
                    'first_name': 'Yuni',
                    'last_name': 'Astuti',
                    'email': 'yuni.astuti@hotel.com',
                    'department': 'Housekeeping',
                    'position': 'Laundry Attendant',
                    'salary': Decimal('3500000.00'),  # 3.5 million IDR
                    'hire_date': date(2022, 2, 14)
                },
                # Food & Beverage
                {
                    'username': 'chef.budi',
                    'first_name': 'Budi',
                    'last_name': 'Santoso',
                    'email': 'chef.budi@hotel.com',
                    'department': 'Food & Beverage',
                    'position': 'Chef de Cuisine',
                    'salary': Decimal('12000000.00'),  # 12 million IDR
                    'hire_date': date(2019, 7, 1)
                },
                {
                    'username': 'ari.waiter',
                    'first_name': 'Ari',
                    'last_name': 'Wibowo',
                    'email': 'ari.wibowo@hotel.com',
                    'department': 'Food & Beverage',
                    'position': 'Waiter',
                    'salary': Decimal('4000000.00'),  # 4 million IDR
                    'hire_date': date(2022, 5, 20)
                },
                {
                    'username': 'linda.barista',
                    'first_name': 'Linda',
                    'last_name': 'Maharani',
                    'email': 'linda.maharani@hotel.com',
                    'department': 'Food & Beverage',
                    'position': 'Barista',
                    'salary': Decimal('4200000.00'),  # 4.2 million IDR
                    'hire_date': date(2021, 11, 10)
                },
                # Engineering
                {
                    'username': 'pak.agus',
                    'first_name': 'Agus',
                    'last_name': 'Setiawan',
                    'email': 'agus.setiawan@hotel.com',
                    'department': 'Engineering',
                    'position': 'Chief Engineer',
                    'salary': Decimal('10000000.00'),  # 10 million IDR
                    'hire_date': date(2018, 3, 15)
                },
                {
                    'username': 'hendro.technician',
                    'first_name': 'Hendro',
                    'last_name': 'Wijaya',
                    'email': 'hendro.wijaya@hotel.com',
                    'department': 'Engineering',
                    'position': 'Maintenance Technician',
                    'salary': Decimal('5500000.00'),  # 5.5 million IDR
                    'hire_date': date(2021, 9, 1)
                },
                # Security
                {
                    'username': 'bambang.security',
                    'first_name': 'Bambang',
                    'last_name': 'Sutrisno',
                    'email': 'bambang.sutrisno@hotel.com',
                    'department': 'Security',
                    'position': 'Security Officer',
                    'salary': Decimal('4200000.00'),  # 4.2 million IDR
                    'hire_date': date(2020, 12, 1)
                },
                {
                    'username': 'joko.security',
                    'first_name': 'Joko',
                    'last_name': 'Prasetyo',
                    'email': 'joko.prasetyo@hotel.com',
                    'department': 'Security',
                    'position': 'Security Supervisor',
                    'salary': Decimal('6000000.00'),  # 6 million IDR
                    'hire_date': date(2019, 8, 15)
                },
                # Management
                {
                    'username': 'ibu.sarah',
                    'first_name': 'Sarah',
                    'last_name': 'Indira',
                    'email': 'sarah.indira@hotel.com',
                    'department': 'Human Resources',
                    'position': 'HR Manager',
                    'salary': Decimal('15000000.00'),  # 15 million IDR
                    'hire_date': date(2018, 1, 10)
                },
                {
                    'username': 'pak.rudi',
                    'first_name': 'Rudi',
                    'last_name': 'Hartono',
                    'email': 'rudi.hartono@hotel.com',
                    'department': 'Finance & Accounting',
                    'position': 'Finance Manager',
                    'salary': Decimal('18000000.00'),  # 18 million IDR
                    'hire_date': date(2017, 5, 1)
                }
            ]

            # Create users and employees
            created_employees = []
            for emp_data in employees_data:
                # Create user
                user, user_created = User.objects.get_or_create(
                    username=emp_data['username'],
                    defaults={
                        'first_name': emp_data['first_name'],
                        'last_name': emp_data['last_name'],
                        'email': emp_data['email'],
                        'is_active': True
                    }
                )
                
                if user_created:
                    user.set_password('hotel123')  # Default password
                    user.save()
                
                # Get department
                department = Department.objects.get(name=emp_data['department'])
                
                # Create employee
                employee, emp_created = Employee.objects.get_or_create(
                    user=user,
                    defaults={
                        'department': department,
                        'position': emp_data['position'],
                        'salary': emp_data['salary'],
                        'hire_date': emp_data['hire_date'],
                        'is_active': True
                    }
                )
                
                if emp_created:
                    created_employees.append(employee)
                    self.stdout.write(f'Created employee: {employee.user.get_full_name()} - {employee.position}')

            # Assign managers to departments
            manager_assignments = [
                ('Front Office', 'dani.frontoffice'),
                ('Housekeeping', 'ibu.mira'),
                ('Food & Beverage', 'chef.budi'),
                ('Engineering', 'pak.agus'),
                ('Security', 'joko.security'),
                ('Human Resources', 'ibu.sarah'),
                ('Finance & Accounting', 'pak.rudi'),
            ]

            for dept_name, manager_username in manager_assignments:
                try:
                    department = Department.objects.get(name=dept_name)
                    manager_user = User.objects.get(username=manager_username)
                    manager_employee = Employee.objects.get(user=manager_user)
                    
                    department.manager = manager_employee
                    department.save()
                    self.stdout.write(f'Assigned {manager_employee.user.get_full_name()} as manager of {dept_name}')
                except (Department.DoesNotExist, User.DoesNotExist, Employee.DoesNotExist):
                    self.stdout.write(f'Could not assign manager for {dept_name}')

            # Create shifts for the past week
            today = date.today()
            shift_types = [
                ('MORNING', time(6, 0), time(14, 0)),   # 6 AM - 2 PM
                ('AFTERNOON', time(14, 0), time(22, 0)), # 2 PM - 10 PM  
                ('NIGHT', time(22, 0), time(6, 0)),      # 10 PM - 6 AM next day
            ]

            # Create shifts for past 7 days
            for day_offset in range(-7, 1):  # Past 7 days including today
                shift_date = today + timedelta(days=day_offset)
                
                for employee in created_employees:
                    # Not all employees work every day
                    if random.choice([True, True, True, False]):  # 75% chance of working
                        shift_type, start_time, end_time = random.choice(shift_types)
                        
                        # Security works night shifts more often
                        if employee.department.name == 'Security' and random.choice([True, False]):
                            shift_type, start_time, end_time = ('NIGHT', time(22, 0), time(6, 0))
                        
                        # Front office staff work more morning/afternoon shifts
                        if employee.department.name == 'Front Office':
                            shift_type, start_time, end_time = random.choice([
                                ('MORNING', time(6, 0), time(14, 0)),
                                ('AFTERNOON', time(14, 0), time(22, 0))
                            ])

                        shift = Shift.objects.create(
                            employee=employee,
                            shift_date=shift_date,
                            shift_type=shift_type,
                            start_time=start_time,
                            end_time=end_time,
                            break_duration=60,  # 1 hour break
                            notes=f'Shift {shift_type.lower()} untuk {employee.department.name}'
                        )

                        # Create attendance for the shift
                        # Most employees are present, some late, few absent
                        attendance_status = random.choices(
                            ['present', 'late', 'absent'],
                            weights=[80, 15, 5]  # 80% present, 15% late, 5% absent
                        )[0]

                        if attendance_status == 'present':
                            clock_in = datetime.combine(shift_date, start_time)
                            clock_out = datetime.combine(shift_date, end_time)
                            if shift_type == 'NIGHT' and end_time < start_time:
                                clock_out = datetime.combine(shift_date + timedelta(days=1), end_time)
                            
                            Attendance.objects.create(
                                shift=shift,
                                clock_in=clock_in,
                                clock_out=clock_out,
                                status='PRESENT',
                                notes='Hadir tepat waktu'
                            )
                        elif attendance_status == 'late':
                            # Late by 15-45 minutes
                            late_minutes = random.randint(15, 45)
                            late_time = datetime.combine(shift_date, start_time) + timedelta(minutes=late_minutes)
                            clock_out = datetime.combine(shift_date, end_time)
                            if shift_type == 'NIGHT' and end_time < start_time:
                                clock_out = datetime.combine(shift_date + timedelta(days=1), end_time)
                            
                            Attendance.objects.create(
                                shift=shift,
                                clock_in=late_time,
                                clock_out=clock_out,
                                status='LATE',
                                late_minutes=late_minutes,
                                notes=f'Terlambat {late_minutes} menit'
                            )
                        else:  # absent
                            Attendance.objects.create(
                                shift=shift,
                                status='ABSENT',
                                notes='Tidak hadir tanpa keterangan'
                            )

            total_departments = Department.objects.count()
            total_employees = Employee.objects.count()
            total_shifts = Shift.objects.count()
            total_attendance = Attendance.objects.count()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created:\n'
                    f'- {total_departments} departments\n'
                    f'- {total_employees} employees\n'
                    f'- {total_shifts} shifts\n'
                    f'- {total_attendance} attendance records'
                )
            )