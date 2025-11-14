"""
Script to add restaurant staff with realistic Indonesian data and schedules.
Requirements:
- 2 shifts per day (Morning & Evening)
- 7 days a week operation
- Each staff works 5 days per week
- Minimum 1 staff per role per shift
"""

import os
import django
from datetime import datetime, timedelta, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.restaurant.models import Staff, Branch, Schedule, StaffRole

User = get_user_model()

def create_staff_with_schedules():
    # Get the main branch
    branch = Branch.objects.first()
    if not branch:
        print("No branch found. Please create a branch first.")
        return

    print(f"Adding staff to branch: {branch.name}")

    # Define staff data with Indonesian names
    staff_data = [
        # CASHIER - 4 staff (2 per shift rotation)
        {
            'name': 'Siti Nurhaliza',
            'email': 'siti.nurhaliza@ladapala.com',
            'phone': '081234567801',
            'role': StaffRole.CASHIER,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Mon-Fri morning
            'days_off': [5, 6]  # Sat, Sun
        },
        {
            'name': 'Dewi Kartika',
            'email': 'dewi.kartika@ladapala.com',
            'phone': '081234567802',
            'role': StaffRole.CASHIER,
            'shift_pattern': ['EVENING', 'EVENING', 'EVENING', 'EVENING', 'EVENING'],  # Mon-Fri evening
            'days_off': [5, 6]  # Sat, Sun
        },
        {
            'name': 'Rina Andriani',
            'email': 'rina.andriani@ladapala.com',
            'phone': '081234567803',
            'role': StaffRole.CASHIER,
            'shift_pattern': ['MORNING', 'MORNING', 'EVENING', 'EVENING', 'EVENING'],  # Tue-Thu, Sat-Sun
            'days_off': [0, 4]  # Mon, Fri
        },
        {
            'name': 'Maya Anggraini',
            'email': 'maya.anggraini@ladapala.com',
            'phone': '081234567804',
            'role': StaffRole.CASHIER,
            'shift_pattern': ['EVENING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Wed-Sun
            'days_off': [0, 1]  # Mon, Tue
        },

        # KITCHEN - 6 staff (3 per shift rotation)
        {
            'name': 'Budi Santoso',
            'email': 'budi.santoso@ladapala.com',
            'phone': '081234567805',
            'role': StaffRole.KITCHEN,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Mon-Fri
            'days_off': [5, 6]
        },
        {
            'name': 'Ahmad Hidayat',
            'email': 'ahmad.hidayat@ladapala.com',
            'phone': '081234567806',
            'role': StaffRole.KITCHEN,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Tue-Sat
            'days_off': [0, 6]
        },
        {
            'name': 'Eko Prasetyo',
            'email': 'eko.prasetyo@ladapala.com',
            'phone': '081234567807',
            'role': StaffRole.KITCHEN,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Wed-Sun
            'days_off': [0, 1]
        },
        {
            'name': 'Hendra Wijaya',
            'email': 'hendra.wijaya@ladapala.com',
            'phone': '081234567808',
            'role': StaffRole.KITCHEN,
            'shift_pattern': ['EVENING', 'EVENING', 'EVENING', 'EVENING', 'EVENING'],  # Mon-Fri
            'days_off': [5, 6]
        },
        {
            'name': 'Rudi Hartono',
            'email': 'rudi.hartono@ladapala.com',
            'phone': '081234567809',
            'role': StaffRole.KITCHEN,
            'shift_pattern': ['EVENING', 'EVENING', 'EVENING', 'EVENING', 'EVENING'],  # Tue-Sat
            'days_off': [0, 6]
        },
        {
            'name': 'Agus Setiawan',
            'email': 'agus.setiawan@ladapala.com',
            'phone': '081234567810',
            'role': StaffRole.KITCHEN,
            'shift_pattern': ['EVENING', 'EVENING', 'EVENING', 'EVENING', 'EVENING'],  # Wed-Sun
            'days_off': [0, 1]
        },

        # WAREHOUSE - 3 staff
        {
            'name': 'Joko Susilo',
            'email': 'joko.susilo@ladapala.com',
            'phone': '081234567811',
            'role': StaffRole.WAREHOUSE,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Mon-Fri
            'days_off': [5, 6]
        },
        {
            'name': 'Bambang Irawan',
            'email': 'bambang.irawan@ladapala.com',
            'phone': '081234567812',
            'role': StaffRole.WAREHOUSE,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Tue-Sat
            'days_off': [0, 6]
        },
        {
            'name': 'Dedi Kurniawan',
            'email': 'dedi.kurniawan@ladapala.com',
            'phone': '081234567813',
            'role': StaffRole.WAREHOUSE,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Wed-Sun
            'days_off': [0, 1]
        },
    ]

    # Shift times
    shift_times = {
        'MORNING': {'start': time(7, 0), 'end': time(15, 0)},    # 07:00 - 15:00
        'EVENING': {'start': time(15, 0), 'end': time(23, 0)},   # 15:00 - 23:00
    }

    # Start date for schedules (next Monday)
    today = datetime.now().date()
    days_until_monday = (7 - today.weekday()) % 7
    start_date = today + timedelta(days=days_until_monday if days_until_monday > 0 else 7)

    print(f"\nCreating schedules starting from: {start_date} (Monday)")
    print("=" * 80)

    created_count = 0
    schedule_count = 0

    for staff_info in staff_data:
        # Check if user already exists
        user = User.objects.filter(email=staff_info['email']).first()

        if not user:
            # Create user
            user = User.objects.create_user(
                email=staff_info['email'],
                password='password123',  # Default password
                first_name=staff_info['name'].split()[0],
                last_name=' '.join(staff_info['name'].split()[1:])
            )
            print(f"✓ Created user: {staff_info['name']}")
        else:
            print(f"○ User already exists: {staff_info['name']}")

        # Check if staff record exists
        staff = Staff.objects.filter(user=user).first()

        if not staff:
            # Create staff record
            staff = Staff.objects.create(
                user=user,
                branch=branch,
                role=staff_info['role'],
                phone=staff_info['phone']
            )
            created_count += 1
            print(f"  └─ Staff record created: {staff_info['role']}")
        else:
            print(f"  └─ Staff record exists: {staff.role}")

        # Delete existing schedules for this staff (to avoid duplicates)
        Schedule.objects.filter(staff=staff, date__gte=start_date).delete()

        # Create schedules for next 4 weeks (28 days)
        current_date = start_date
        week_count = 0

        for week in range(4):  # 4 weeks
            work_days = 0
            for day in range(7):  # 7 days per week
                day_of_week = (current_date + timedelta(days=day)).weekday()

                # Check if this is a day off
                if day_of_week in staff_info['days_off']:
                    continue

                # Determine shift for this day
                if work_days < len(staff_info['shift_pattern']):
                    shift_type = staff_info['shift_pattern'][work_days]
                else:
                    continue

                schedule_date = current_date + timedelta(days=day)

                # Create schedule
                Schedule.objects.create(
                    staff=staff,
                    date=schedule_date,
                    shift_type=shift_type,
                    start_time=shift_times[shift_type]['start'],
                    end_time=shift_times[shift_type]['end'],
                    is_confirmed=True,
                    notes=f'Week {week + 1} schedule'
                )

                work_days += 1
                schedule_count += 1

            # Move to next week
            current_date += timedelta(days=7)

        schedules_created = Schedule.objects.filter(staff=staff, date__gte=start_date).count()
        print(f"  └─ Created {schedules_created} schedules (next 4 weeks)")

    print("\n" + "=" * 80)
    print(f"✓ Created {created_count} new staff members")
    print(f"✓ Total staff in system: {Staff.objects.count()}")
    print(f"✓ Total schedules created: {schedule_count}")

    # Print schedule summary
    print("\n" + "=" * 80)
    print("SCHEDULE SUMMARY FOR NEXT WEEK")
    print("=" * 80)

    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    for day_offset in range(7):
        check_date = start_date + timedelta(days=day_offset)
        day_name = days[day_offset]

        print(f"\n{day_name} ({check_date})")
        print("-" * 40)

        for shift in ['MORNING', 'EVENING']:
            schedules = Schedule.objects.filter(
                date=check_date,
                shift_type=shift
            ).select_related('staff__user')

            staff_list = [f"{s.staff.user.get_full_name()} ({s.staff.role})" for s in schedules]

            print(f"{shift:10} ({shift_times[shift]['start']}-{shift_times[shift]['end']}): {len(staff_list)} staff")
            for staff_name in staff_list:
                print(f"           - {staff_name}")

    print("\n" + "=" * 80)
    print("✓ Staff and schedules created successfully!")
    print("\nDefault password for all staff: password123")
    print("=" * 80)

if __name__ == '__main__':
    create_staff_with_schedules()
