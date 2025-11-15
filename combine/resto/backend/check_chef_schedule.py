"""
Check chef schedules for today
"""
import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.restaurant.models import Schedule, Staff, StaffRole

today = date.today()
print(f"Checking schedules for: {today}")
print("=" * 60)

# Get all chef/kitchen staff
chefs = Staff.objects.filter(role__in=[StaffRole.CHEF, StaffRole.KITCHEN])
print(f"\n📋 Found {chefs.count()} chef/kitchen staff")

for chef in chefs:
    print(f"\n👨‍🍳 {chef.user.get_full_name()} ({chef.get_role_display()})")

    # Check today's schedule
    today_schedule = Schedule.objects.filter(
        staff=chef,
        date=today
    ).first()

    if today_schedule:
        print(f"  ✅ Schedule found:")
        print(f"     - Shift: {today_schedule.get_shift_type_display()}")
        print(f"     - Confirmed: {today_schedule.is_confirmed}")

        if not today_schedule.is_confirmed:
            print(f"  ⚠️  Schedule is NOT CONFIRMED - this will prevent session start!")
            print(f"     Fixing...")
            today_schedule.is_confirmed = True
            today_schedule.save()
            print(f"  ✅ Schedule confirmed!")
    else:
        print(f"  ❌ No schedule found for today")

print("\n" + "=" * 60)
print("✅ Check complete!")
