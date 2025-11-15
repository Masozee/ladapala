"""
Script to add more restaurant staff with Chef, Bar, and Waitress roles.
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

def add_more_staff():
    # Get the main branch
    branch = Branch.objects.first()
    if not branch:
        print("No branch found. Please create a branch first.")
        return

    print(f"Adding more staff to branch: {branch.name}")

    # Define additional staff data with Indonesian names
    staff_data = [
        # CHEF - 4 staff (2 per shift rotation) - Head chefs who supervise kitchen
        {
            'name': 'Chef Ridwan Kamil',
            'email': 'ridwan.kamil@ladapala.com',
            'phone': '081234567820',
            'role': StaffRole.CHEF,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Mon-Fri
            'days_off': [5, 6]  # Sat, Sun
        },
        {
            'name': 'Chef Anisa Rahman',
            'email': 'anisa.rahman@ladapala.com',
            'phone': '081234567821',
            'role': StaffRole.CHEF,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Tue-Sat
            'days_off': [0, 6]  # Mon, Sun
        },
        {
            'name': 'Chef Dimas Pratama',
            'email': 'dimas.pratama@ladapala.com',
            'phone': '081234567822',
            'role': StaffRole.CHEF,
            'shift_pattern': ['EVENING', 'EVENING', 'EVENING', 'EVENING', 'EVENING'],  # Mon-Fri
            'days_off': [5, 6]  # Sat, Sun
        },
        {
            'name': 'Chef Putri Maharani',
            'email': 'putri.maharani@ladapala.com',
            'phone': '081234567823',
            'role': StaffRole.CHEF,
            'shift_pattern': ['EVENING', 'EVENING', 'EVENING', 'EVENING', 'EVENING'],  # Wed-Sun
            'days_off': [0, 1]  # Mon, Tue
        },

        # BAR - 4 staff (2 per shift rotation)
        {
            'name': 'Fajar Nugraha',
            'email': 'fajar.nugraha@ladapala.com',
            'phone': '081234567824',
            'role': StaffRole.BAR,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Mon-Fri
            'days_off': [5, 6]  # Sat, Sun
        },
        {
            'name': 'Indra Gunawan',
            'email': 'indra.gunawan@ladapala.com',
            'phone': '081234567825',
            'role': StaffRole.BAR,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Wed-Sun
            'days_off': [0, 1]  # Mon, Tue
        },
        {
            'name': 'Rizki Firmansyah',
            'email': 'rizki.firmansyah@ladapala.com',
            'phone': '081234567826',
            'role': StaffRole.BAR,
            'shift_pattern': ['EVENING', 'EVENING', 'EVENING', 'EVENING', 'EVENING'],  # Mon-Fri
            'days_off': [5, 6]  # Sat, Sun
        },
        {
            'name': 'Yoga Aditya',
            'email': 'yoga.aditya@ladapala.com',
            'phone': '081234567827',
            'role': StaffRole.BAR,
            'shift_pattern': ['EVENING', 'EVENING', 'EVENING', 'EVENING', 'EVENING'],  # Wed-Sun
            'days_off': [0, 1]  # Mon, Tue
        },

        # WAITRESS - 8 staff (4 per shift rotation)
        {
            'name': 'Ayu Lestari',
            'email': 'ayu.lestari@ladapala.com',
            'phone': '081234567828',
            'role': StaffRole.WAITRESS,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Mon-Fri
            'days_off': [5, 6]  # Sat, Sun
        },
        {
            'name': 'Bella Safira',
            'email': 'bella.safira@ladapala.com',
            'phone': '081234567829',
            'role': StaffRole.WAITRESS,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Tue-Sat
            'days_off': [0, 6]  # Mon, Sun
        },
        {
            'name': 'Citra Permata',
            'email': 'citra.permata@ladapala.com',
            'phone': '081234567830',
            'role': StaffRole.WAITRESS,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Wed-Sun
            'days_off': [0, 1]  # Mon, Tue
        },
        {
            'name': 'Dina Amalia',
            'email': 'dina.amalia@ladapala.com',
            'phone': '081234567831',
            'role': StaffRole.WAITRESS,
            'shift_pattern': ['MORNING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Thu-Mon
            'days_off': [1, 2]  # Tue, Wed
        },
        {
            'name': 'Eka Wulandari',
            'email': 'eka.wulandari@ladapala.com',
            'phone': '081234567832',
            'role': StaffRole.WAITRESS,
            'shift_pattern': ['EVENING', 'EVENING', 'EVENING', 'EVENING', 'EVENING'],  # Mon-Fri
            'days_off': [5, 6]  # Sat, Sun
        },
        {
            'name': 'Fitri Handayani',
            'email': 'fitri.handayani@ladapala.com',
            'phone': '081234567833',
            'role': StaffRole.WAITRESS,
            'shift_pattern': ['EVENING', 'EVENING', 'EVENING', 'EVENING', 'EVENING'],  # Tue-Sat
            'days_off': [0, 6]  # Mon, Sun
        },
        {
            'name': 'Gita Puspita',
            'email': 'gita.puspita@ladapala.com',
            'phone': '081234567834',
            'role': StaffRole.WAITRESS,
            'shift_pattern': ['EVENING', 'EVENING', 'EVENING', 'EVENING', 'EVENING'],  # Wed-Sun
            'days_off': [0, 1]  # Mon, Tue
        },
        {
            'name': 'Hani Rahmawati',
            'email': 'hani.rahmawati@ladapala.com',
            'phone': '081234567835',
            'role': StaffRole.WAITRESS,
            'shift_pattern': ['EVENING', 'EVENING', 'EVENING', 'EVENING', 'EVENING'],  # Thu-Mon
            'days_off': [1, 2]  # Tue, Wed
        },

        # Additional CASHIER - 2 more for better coverage
        {
            'name': 'Intan Permatasari',
            'email': 'intan.permatasari@ladapala.com',
            'phone': '081234567836',
            'role': StaffRole.CASHIER,
            'shift_pattern': ['MORNING', 'MORNING', 'EVENING', 'EVENING', 'EVENING'],  # Thu-Mon
            'days_off': [1, 2]  # Tue, Wed
        },
        {
            'name': 'Julia Kartini',
            'email': 'julia.kartini@ladapala.com',
            'phone': '081234567837',
            'role': StaffRole.CASHIER,
            'shift_pattern': ['EVENING', 'MORNING', 'MORNING', 'MORNING', 'MORNING'],  # Fri-Tue
            'days_off': [2, 3]  # Wed, Thu
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
                first_name=staff_info['name'].split()[0] if not staff_info['name'].startswith('Chef') else 'Chef',
                last_name=' '.join(staff_info['name'].split()[1:])
            )
            print(f"✓ Created user: {staff_info['name']}")
        else:
            print(f"○ User already exists: {staff_info['name']}")
            continue  # Skip if user exists

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
            continue  # Skip if staff exists

        # Delete existing schedules for this staff (to avoid duplicates)
        Schedule.objects.filter(staff=staff, date__gte=start_date).delete()

        # Create schedules for next 4 weeks (28 days)
        current_date = start_date

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

    # Print staff summary by role
    print("\n" + "=" * 80)
    print("STAFF SUMMARY BY ROLE")
    print("=" * 80)

    for role in StaffRole:
        count = Staff.objects.filter(role=role).count()
        if count > 0:
            print(f"{role.label:20} : {count} staff")
            staff_list = Staff.objects.filter(role=role).select_related('user')
            for s in staff_list:
                print(f"  • {s.user.get_full_name():30} ({s.user.email})")

    # Print schedule summary for next week
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

            # Group by role
            by_role = {}
            for s in schedules:
                role = s.staff.role
                if role not in by_role:
                    by_role[role] = []
                by_role[role].append(s.staff.user.get_full_name())

            total_staff = sum(len(v) for v in by_role.values())
            print(f"{shift:10} ({shift_times[shift]['start']}-{shift_times[shift]['end']}): {total_staff} staff")

            for role in sorted(by_role.keys()):
                staff_names = ', '.join(by_role[role])
                print(f"           [{role}] {staff_names}")

    print("\n" + "=" * 80)
    print("✓ Additional staff and schedules created successfully!")
    print("\nDefault password for all staff: password123")
    print("=" * 80)

if __name__ == '__main__':
    add_more_staff()
