"""
Staff Assignment Algorithm for Housekeeping Tasks

Auto-assigns housekeeping staff based on:
1. Work schedule (must be scheduled for today)
2. Availability (currently clocked in)
3. Workload balance (fewer assigned tasks)
4. Floor/area assignment
"""
from django.utils import timezone
from django.db.models import Count, Q
from apps.user.models import Employee, Shift, Attendance
from apps.hotel.models import HousekeepingTask


def get_available_housekeeping_staff(target_date=None):
    """
    Get list of housekeeping staff who are available for task assignment.

    Args:
        target_date: Date to check (defaults to today)

    Returns:
        QuerySet of User objects with housekeeping role who are available
    """
    if target_date is None:
        target_date = timezone.now().date()

    # Get all housekeeping staff users (role is now directly on User model)
    from apps.user.models import User
    housekeeping_users = User.objects.filter(
        role='HOUSEKEEPING',
        is_active=True
    ).values_list('id', flat=True)

    # Get employees for these users who have shifts scheduled today
    scheduled_employees = Employee.objects.filter(
        user_id__in=housekeeping_users,
        employment_status='ACTIVE',
        is_active=True,
        shifts__shift_date=target_date
    ).distinct()

    # Filter by attendance (clocked in) for more accuracy
    clocked_in_employees = scheduled_employees.filter(
        shifts__shift_date=target_date,
        shifts__attendance__clock_in__isnull=False,
        shifts__attendance__clock_out__isnull=True,
        shifts__attendance__status__in=['PRESENT', 'LATE']
    ).distinct()

    # If no one is clocked in yet, return all scheduled staff
    if not clocked_in_employees.exists():
        available_employees = scheduled_employees
    else:
        available_employees = clocked_in_employees

    # Return the User objects (not Employee objects)
    available_user_ids = available_employees.values_list('user_id', flat=True)
    from apps.user.models import User
    return User.objects.filter(id__in=available_user_ids)


def get_staff_workload(user, target_date=None):
    """
    Calculate current workload for a staff member.

    Args:
        user: User object
        target_date: Date to check (defaults to today)

    Returns:
        dict with workload metrics
    """
    if target_date is None:
        target_date = timezone.now().date()

    # Count active tasks (not completed)
    active_tasks = HousekeepingTask.objects.filter(
        assigned_to=user,
        scheduled_date=target_date,
        status__in=['DIRTY', 'CLEANING', 'INSPECTING']
    )

    total_tasks = active_tasks.count()

    # Count by status
    dirty_count = active_tasks.filter(status='DIRTY').count()
    cleaning_count = active_tasks.filter(status='CLEANING').count()
    inspecting_count = active_tasks.filter(status='INSPECTING').count()

    # Calculate estimated workload in minutes
    estimated_minutes = sum([
        task.estimated_duration_minutes
        for task in active_tasks.filter(actual_start_time__isnull=True)
    ])

    # Add remaining time for in-progress tasks
    for task in active_tasks.filter(actual_start_time__isnull=False, completion_time__isnull=True):
        elapsed = (timezone.now() - task.actual_start_time).total_seconds() / 60
        remaining = max(0, task.estimated_duration_minutes - elapsed)
        estimated_minutes += remaining

    return {
        'total_tasks': total_tasks,
        'dirty_tasks': dirty_count,
        'cleaning_tasks': cleaning_count,
        'inspecting_tasks': inspecting_count,
        'estimated_minutes': int(estimated_minutes),
        'estimated_hours': round(estimated_minutes / 60, 1)
    }


def get_staff_floor_assignment(user):
    """
    Determine which floor(s) a staff member typically works on.
    Based on their recent task history.

    Args:
        user: User object

    Returns:
        list of floor numbers
    """
    # Get last 10 completed tasks to determine usual floors
    recent_tasks = HousekeepingTask.objects.filter(
        assigned_to=user,
        status='CLEAN'
    ).select_related('room').order_by('-completion_time')[:10]

    floors = [task.room.floor for task in recent_tasks if task.room]

    # Return most common floors
    if floors:
        floor_counts = {}
        for floor in floors:
            floor_counts[floor] = floor_counts.get(floor, 0) + 1

        # Return floors sorted by frequency
        sorted_floors = sorted(floor_counts.items(), key=lambda x: x[1], reverse=True)
        return [floor for floor, count in sorted_floors]

    return []


def assign_housekeeping_staff(room, task_type='CHECKOUT_CLEANING', priority='MEDIUM', target_date=None):
    """
    Auto-assign best available housekeeping staff for a task.

    Algorithm:
    1. Get available staff (scheduled and clocked in)
    2. Prioritize staff who work on the same floor
    3. Balance workload - assign to staff with fewer tasks
    4. If tied, assign to staff with less estimated work time

    Args:
        room: Room object that needs cleaning
        task_type: Type of cleaning task
        priority: Task priority
        target_date: Date for task (defaults to today)

    Returns:
        User object of assigned staff, or None if no one available
    """
    if target_date is None:
        target_date = timezone.now().date()

    # Get available staff
    available_staff = get_available_housekeeping_staff(target_date)

    if not available_staff.exists():
        # No staff available, task will remain unassigned
        return None

    # Calculate scores for each staff member
    staff_scores = []

    for staff_user in available_staff:
        score = 0

        # Get workload
        workload = get_staff_workload(staff_user, target_date)

        # Lower workload = higher score (inverse relationship)
        # Base score: 100 - (tasks * 10)
        score += max(0, 100 - (workload['total_tasks'] * 10))

        # Bonus for less estimated time remaining
        # Each hour of work reduces score by 5 points
        score -= workload['estimated_hours'] * 5

        # Bonus for floor familiarity
        staff_floors = get_staff_floor_assignment(staff_user)
        if room.floor in staff_floors:
            # +30 points for primary floor
            floor_index = staff_floors.index(room.floor)
            if floor_index == 0:
                score += 30
            elif floor_index == 1:
                score += 20
            else:
                score += 10

        # Bonus for being currently active (already started a task)
        if workload['cleaning_tasks'] > 0:
            # +15 points for momentum (finishing tasks on same floor)
            last_active_task = HousekeepingTask.objects.filter(
                assigned_to=staff_user,
                status='CLEANING'
            ).select_related('room').order_by('-actual_start_time').first()

            if last_active_task and last_active_task.room.floor == room.floor:
                score += 15

        staff_scores.append({
            'user': staff_user,
            'score': score,
            'workload': workload
        })

    # Sort by score (highest first)
    staff_scores.sort(key=lambda x: x['score'], reverse=True)

    # Return best candidate
    best_staff = staff_scores[0]

    return best_staff['user']


def create_housekeeping_task_on_checkout(reservation):
    """
    Create housekeeping task when guest checks out.
    Automatically assigns to best available staff.

    Args:
        reservation: Reservation object

    Returns:
        Created HousekeepingTask object, or None if failed
    """
    if not reservation.room:
        return None

    # Determine task priority based on next check-in
    priority = 'MEDIUM'
    next_reservation = None

    # Check if there's a next guest checking in soon
    from apps.hotel.models import Reservation
    upcoming_reservations = Reservation.objects.filter(
        room=reservation.room,
        status__in=['CONFIRMED', 'PENDING'],
        check_in_date__gte=timezone.now().date()
    ).order_by('check_in_date')

    if upcoming_reservations.exists():
        next_reservation = upcoming_reservations.first()

        # Check how soon next guest arrives
        # Assume standard check-in time of 14:00 (2 PM) if no time field exists
        check_in_datetime = timezone.make_aware(
            timezone.datetime.combine(
                next_reservation.check_in_date,
                timezone.datetime.min.time().replace(hour=14, minute=0)
            )
        )

        hours_until_checkin = (check_in_datetime - timezone.now()).total_seconds() / 3600

        if hours_until_checkin <= 2:
            priority = 'URGENT'
        elif hours_until_checkin <= 4:
            priority = 'HIGH'
        elif hours_until_checkin <= 8:
            priority = 'MEDIUM'
        else:
            priority = 'LOW'

    # Assign staff
    assigned_staff = assign_housekeeping_staff(
        room=reservation.room,
        task_type='CHECKOUT_CLEANING',
        priority=priority
    )

    # Calculate estimated completion time
    estimated_duration = 60  # default 60 minutes for checkout cleaning
    estimated_completion = timezone.now() + timezone.timedelta(minutes=estimated_duration)

    # Create task
    task = HousekeepingTask.objects.create(
        room=reservation.room,
        task_type='CHECKOUT_CLEANING',
        status='DIRTY',
        priority=priority,
        assigned_to=assigned_staff,
        scheduled_date=timezone.now().date(),
        estimated_duration_minutes=estimated_duration,
        estimated_completion=estimated_completion,
        guest_checkout=reservation.check_out_date,
        next_guest_checkin=check_in_datetime if next_reservation else None,
        notes=f'Checkout cleaning for {reservation.guest.full_name if reservation.guest else "guest"}',
        created_by=None  # System-generated
    )

    return task
