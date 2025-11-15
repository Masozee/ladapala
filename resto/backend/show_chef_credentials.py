"""
Show chef credentials for login
"""
import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.restaurant.models import Schedule, Staff, StaffRole

today = date.today()
print(f"🔐 CHEF LOGIN CREDENTIALS FOR TODAY ({today})")
print("=" * 70)

# Get staff with today's confirmed schedule
schedules = Schedule.objects.filter(
    date=today,
    is_confirmed=True,
    staff__role__in=[StaffRole.CHEF, StaffRole.KITCHEN]
).select_related('staff', 'staff__user')

if not schedules:
    print("\n❌ No confirmed schedules found for today")
    print("\nTo add schedules, run:")
    print("  uv run python add_staff_with_schedules.py")
else:
    print(f"\n✅ {schedules.count()} staff scheduled for today:\n")

    for schedule in schedules:
        staff = schedule.staff
        user = staff.user
        print(f"👨‍🍳 {user.get_full_name()} ({staff.get_role_display()})")
        print(f"   📧 Email: {user.email}")
        print(f"   🔑 Password: password123  (default)")
        print(f"   ⏰ Shift: {schedule.get_shift_type_display()}")
        print(f"   📍 Location: Kitchen/Bar")
        print()

print("=" * 70)
print("\n💡 To login:")
print("   1. Go to http://localhost:3000/login")
print("   2. Use email and password above")
print("   3. Navigate to http://localhost:3000/kitchen")
print("   4. Click 'Start Session' button")
print("\n✅ Session will start automatically using today's schedule!")
