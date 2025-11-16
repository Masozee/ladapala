from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.hotel.models.housekeeping import HousekeepingTask
from apps.hotel.models.reservations import Reservation
from apps.hotel.models.rooms import Room
from apps.user.models import User
from datetime import datetime, timedelta, time as dt_time
import random


class Command(BaseCommand):
    help = 'Seed housekeeping tasks synced with reservations - preserves existing data, only adds status updates'

    def handle(self, *args, **options):
        self.stdout.write('Syncing housekeeping tasks with reservations...')

        # Get housekeeping staff (if exists)
        housekeeping_staff = list(User.objects.filter(email__icontains='housekeeping'))
        manager_staff = list(User.objects.filter(email__icontains='manager'))

        today = timezone.now().date()
        now = timezone.now()

        # Get all reservations
        all_reservations = Reservation.objects.select_related('room').all()

        # Track tasks created
        tasks_created = 0
        tasks_updated = 0

        for reservation in all_reservations:
            if not reservation.room:
                continue

            room = reservation.room
            check_out_date = reservation.check_out_date
            check_in_date = reservation.check_in_date

            # For past check-outs: create completed cleaning tasks
            if check_out_date < today and reservation.status == 'CHECKED_OUT':
                # Check if task already exists
                existing_task = HousekeepingTask.objects.filter(
                    room=room,
                    scheduled_date=check_out_date,
                    task_type='CHECKOUT_CLEANING'
                ).first()

                if existing_task:
                    # Update task to completed status if it's not already
                    if existing_task.status != 'CLEAN':
                        # Simulate completed workflow
                        checkout_time = datetime.combine(check_out_date, dt_time(11, 0))
                        start_time = checkout_time + timedelta(minutes=15)
                        completion_time = start_time + timedelta(minutes=random.randint(25, 40))
                        inspection_time = completion_time + timedelta(minutes=5)

                        existing_task.status = 'CLEAN'
                        existing_task.actual_start_time = timezone.make_aware(start_time)
                        existing_task.completion_time = timezone.make_aware(completion_time)
                        existing_task.inspection_passed = True
                        existing_task.inspection_time = timezone.make_aware(inspection_time)

                        if housekeeping_staff:
                            existing_task.assigned_to = random.choice(housekeeping_staff)
                        if manager_staff:
                            existing_task.inspector = random.choice(manager_staff)

                        existing_task.save()
                        tasks_updated += 1
                        self.stdout.write(f'  Updated task to CLEAN: Room {room.number} ({check_out_date})')
                else:
                    # Create completed task
                    checkout_time = datetime.combine(check_out_date, dt_time(11, 0))
                    start_time = checkout_time + timedelta(minutes=15)
                    completion_time = start_time + timedelta(minutes=random.randint(25, 40))
                    inspection_time = completion_time + timedelta(minutes=5)

                    task = HousekeepingTask.objects.create(
                        room=room,
                        task_type='CHECKOUT_CLEANING',
                        status='CLEAN',
                        priority='HIGH',
                        scheduled_date=check_out_date,
                        estimated_duration_minutes=30,
                        actual_start_time=timezone.make_aware(start_time),
                        completion_time=timezone.make_aware(completion_time),
                        estimated_completion=timezone.make_aware(start_time + timedelta(minutes=40)),
                        guest_checkout=timezone.make_aware(checkout_time),
                        inspection_passed=True,
                        inspection_time=timezone.make_aware(inspection_time),
                        inspection_notes='Room cleaned properly, all standards met',
                        assigned_to=random.choice(housekeeping_staff) if housekeeping_staff else None,
                        inspector=random.choice(manager_staff) if manager_staff else None,
                    )
                    tasks_created += 1
                    self.stdout.write(self.style.SUCCESS(f'  Created CLEAN task: Room {room.number} ({check_out_date})'))

            # For today's check-outs: create tasks based on time
            elif check_out_date == today and reservation.status in ['CHECKED_IN', 'CHECKED_OUT']:
                existing_task = HousekeepingTask.objects.filter(
                    room=room,
                    scheduled_date=today,
                    task_type='CHECKOUT_CLEANING'
                ).first()

                if not existing_task:
                    checkout_time = datetime.combine(today, dt_time(11, 0))
                    estimated_start = checkout_time + timedelta(minutes=15)

                    # Determine status based on current time
                    current_hour = now.hour
                    if current_hour < 11:
                        status = 'DIRTY'
                        actual_start = None
                        completion = None
                    elif current_hour < 12:
                        status = 'CLEANING'
                        actual_start = timezone.make_aware(estimated_start)
                        completion = None
                    else:
                        status = 'INSPECTING'
                        actual_start = timezone.make_aware(estimated_start)
                        completion = actual_start + timedelta(minutes=30)

                    task = HousekeepingTask.objects.create(
                        room=room,
                        task_type='CHECKOUT_CLEANING',
                        status=status,
                        priority='URGENT',
                        scheduled_date=today,
                        estimated_duration_minutes=30,
                        actual_start_time=actual_start,
                        completion_time=completion,
                        estimated_completion=timezone.make_aware(estimated_start + timedelta(minutes=40)),
                        guest_checkout=timezone.make_aware(checkout_time),
                        assigned_to=random.choice(housekeeping_staff) if housekeeping_staff else None,
                    )
                    tasks_created += 1
                    self.stdout.write(self.style.SUCCESS(f'  Created {status} task: Room {room.number} (today)'))

            # For currently checked-in guests: create stayover tasks for today
            elif check_in_date <= today <= check_out_date and reservation.status == 'CHECKED_IN':
                existing_task = HousekeepingTask.objects.filter(
                    room=room,
                    scheduled_date=today,
                    task_type='STAYOVER_CLEANING'
                ).first()

                if not existing_task:
                    # Stayover cleaning happens mid-day
                    stayover_time = datetime.combine(today, dt_time(14, 0))

                    # Determine status
                    if now.hour < 14:
                        status = 'DIRTY'
                        actual_start = None
                        completion = None
                    elif now.hour < 15:
                        status = 'CLEANING'
                        actual_start = now - timedelta(minutes=random.randint(5, 20))
                        completion = None
                    else:
                        status = 'CLEAN'
                        actual_start = timezone.make_aware(stayover_time)
                        completion = actual_start + timedelta(minutes=20)

                    task = HousekeepingTask.objects.create(
                        room=room,
                        task_type='STAYOVER_CLEANING',
                        status=status,
                        priority='MEDIUM',
                        scheduled_date=today,
                        estimated_duration_minutes=20,
                        actual_start_time=actual_start,
                        completion_time=completion,
                        estimated_completion=timezone.make_aware(stayover_time + timedelta(minutes=30)),
                        inspection_passed=True if status == 'CLEAN' else None,
                        inspection_time=completion + timedelta(minutes=5) if status == 'CLEAN' else None,
                        assigned_to=random.choice(housekeeping_staff) if housekeeping_staff else None,
                        inspector=random.choice(manager_staff) if status == 'CLEAN' and manager_staff else None,
                    )
                    tasks_created += 1
                    self.stdout.write(self.style.SUCCESS(f'  Created stayover task: Room {room.number} ({status})'))

            # For upcoming check-ins: prepare rooms day before
            elif check_in_date == today + timedelta(days=1):
                # Check if there was a recent checkout
                recent_checkout = Reservation.objects.filter(
                    room=room,
                    check_out_date__lte=today,
                    status='CHECKED_OUT'
                ).order_by('-check_out_date').first()

                if recent_checkout:
                    existing_task = HousekeepingTask.objects.filter(
                        room=room,
                        scheduled_date=today,
                        task_type='DEEP_CLEANING'
                    ).first()

                    if not existing_task:
                        deep_clean_time = datetime.combine(today, dt_time(9, 0))

                        task = HousekeepingTask.objects.create(
                            room=room,
                            task_type='DEEP_CLEANING',
                            status='CLEAN',
                            priority='HIGH',
                            scheduled_date=today,
                            estimated_duration_minutes=60,
                            actual_start_time=timezone.make_aware(deep_clean_time),
                            completion_time=timezone.make_aware(deep_clean_time + timedelta(minutes=55)),
                            estimated_completion=timezone.make_aware(deep_clean_time + timedelta(minutes=90)),
                            next_guest_checkin=timezone.make_aware(datetime.combine(check_in_date, dt_time(14, 0))),
                            inspection_passed=True,
                            inspection_time=timezone.make_aware(deep_clean_time + timedelta(minutes=60)),
                            inspection_notes='Deep cleaned and ready for next guest',
                            assigned_to=random.choice(housekeeping_staff) if housekeeping_staff else None,
                            inspector=random.choice(manager_staff) if manager_staff else None,
                        )
                        tasks_created += 1
                        self.stdout.write(self.style.SUCCESS(f'  Created deep clean task: Room {room.number}'))

        # Create some maintenance tasks for variety
        available_rooms = Room.objects.exclude(
            id__in=Reservation.objects.filter(
                check_in_date__lte=today,
                check_out_date__gte=today,
                status='CHECKED_IN'
            ).values_list('room_id', flat=True)
        )[:2]

        for room in available_rooms:
            existing_maintenance = HousekeepingTask.objects.filter(
                room=room,
                scheduled_date=today,
                task_type='MAINTENANCE'
            ).exists()

            if not existing_maintenance:
                task = HousekeepingTask.objects.create(
                    room=room,
                    task_type='MAINTENANCE',
                    status='DIRTY',
                    priority='LOW',
                    scheduled_date=today,
                    estimated_duration_minutes=45,
                    notes='Preventive maintenance check',
                    estimated_completion=now + timedelta(hours=2),
                )
                tasks_created += 1
                self.stdout.write(self.style.SUCCESS(f'  Created maintenance task: Room {room.number}'))

        self.stdout.write(self.style.SUCCESS('\nHousekeeping seeding complete!'))
        self.stdout.write(f'\nSummary:')
        self.stdout.write(f'  Tasks created: {tasks_created}')
        self.stdout.write(f'  Tasks updated: {tasks_updated}')
        self.stdout.write(f'  Total housekeeping tasks: {HousekeepingTask.objects.count()}')
        self.stdout.write(f'    - DIRTY: {HousekeepingTask.objects.filter(status="DIRTY").count()}')
        self.stdout.write(f'    - CLEANING: {HousekeepingTask.objects.filter(status="CLEANING").count()}')
        self.stdout.write(f'    - INSPECTING: {HousekeepingTask.objects.filter(status="INSPECTING").count()}')
        self.stdout.write(f'    - CLEAN: {HousekeepingTask.objects.filter(status="CLEAN").count()}')
