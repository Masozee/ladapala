from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.hotel.models import HousekeepingTask, AmenityUsage, Room, InventoryItem
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed housekeeping tasks and amenity usage data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding housekeeping data...')

        # Get or create test users for housekeeping staff
        housekeeper1, _ = User.objects.get_or_create(
            email='sari.housekeeper@ladapala.co.id',
            defaults={
                'first_name': 'Sari',
                'last_name': 'Wulandari',
            }
        )

        housekeeper2, _ = User.objects.get_or_create(
            email='rina.housekeeper@ladapala.co.id',
            defaults={
                'first_name': 'Rina',
                'last_name': 'Sari',
            }
        )

        supervisor, _ = User.objects.get_or_create(
            email='maria.supervisor@ladapala.co.id',
            defaults={
                'first_name': 'Maria',
                'last_name': 'Santos',
            }
        )

        inspector, _ = User.objects.get_or_create(
            email='lisa.inspector@ladapala.co.id',
            defaults={
                'first_name': 'Lisa',
                'last_name': 'Wong',
            }
        )

        staff_members = [housekeeper1, housekeeper2, supervisor, inspector]

        # Get rooms
        rooms = list(Room.objects.all()[:15])
        if not rooms:
            self.stdout.write(self.style.ERROR('No rooms found. Please seed rooms first.'))
            return

        # Get or create amenity inventory items
        amenities = []
        amenity_data = [
            ('Handuk Mandi', 'AMENITIES', 15000, 100),
            ('Handuk Kecil', 'AMENITIES', 8000, 150),
            ('Sabun Mandi', 'AMENITIES', 5000, 200),
            ('Sampo', 'AMENITIES', 7000, 180),
            ('Sikat Gigi', 'AMENITIES', 3000, 250),
            ('Pasta Gigi', 'AMENITIES', 4000, 220),
            ('Teh Celup', 'AMENITIES', 2000, 300),
            ('Kopi Sachet', 'AMENITIES', 3000, 280),
            ('Gula Sachet', 'AMENITIES', 1000, 350),
            ('Air Mineral 600ml', 'AMENITIES', 5000, 200),
            ('Tissue Box', 'ROOM_SUPPLIES', 8000, 100),
            ('Sandal Hotel', 'AMENITIES', 10000, 120),
            ('Selimut', 'ROOM_SUPPLIES', 75000, 50),
            ('Sprei', 'ROOM_SUPPLIES', 85000, 60),
            ('Sarung Bantal', 'ROOM_SUPPLIES', 25000, 100),
        ]

        for name, category, price, stock in amenity_data:
            item, created = InventoryItem.objects.get_or_create(
                name=name,
                defaults={
                    'category': category,
                    'unit_price': price,
                    'current_stock': stock,
                    'minimum_stock': 20,
                    'unit_of_measurement': 'pieces',
                    'is_active': True
                }
            )
            amenities.append(item)
            if created:
                self.stdout.write(f'  Created amenity: {name}')

        # Create housekeeping tasks for the past 3 days and next 2 days
        today = timezone.now().date()
        date_range = [today - timedelta(days=i) for i in range(3, 0, -1)] + \
                     [today] + \
                     [today + timedelta(days=i) for i in range(1, 3)]

        task_types = ['CHECKOUT_CLEANING', 'STAYOVER_CLEANING', 'DEEP_CLEANING', 'TURNDOWN_SERVICE']
        statuses = ['DIRTY', 'CLEANING', 'INSPECTING', 'CLEAN']
        priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

        tasks_created = 0
        amenity_usages_created = 0

        for date in date_range:
            # Create 5-10 tasks per day
            num_tasks = random.randint(5, 10)

            for i in range(num_tasks):
                room = random.choice(rooms)
                task_type = random.choice(task_types)

                # Determine status based on date
                if date < today:
                    status = 'CLEAN'  # Past tasks are completed
                elif date == today:
                    status = random.choice(['DIRTY', 'CLEANING', 'INSPECTING', 'CLEAN'])
                else:
                    status = 'DIRTY'  # Future tasks are pending

                priority = random.choice(priorities)
                assigned_to = random.choice(staff_members)

                scheduled_datetime = timezone.make_aware(
                    timezone.datetime.combine(date, timezone.datetime.min.time())
                )

                # Create estimated completion time
                estimated_completion = scheduled_datetime + timedelta(hours=random.randint(2, 8))

                # Create actual times for completed tasks
                actual_start_time = None
                completion_time = None
                if status in ['CLEANING', 'INSPECTING', 'CLEAN']:
                    actual_start_time = scheduled_datetime + timedelta(hours=random.randint(0, 2))
                    if status in ['INSPECTING', 'CLEAN']:
                        completion_time = actual_start_time + timedelta(minutes=random.randint(45, 120))

                # Create task
                task = HousekeepingTask.objects.create(
                    room=room,
                    task_type=task_type,
                    status=status,
                    priority=priority,
                    assigned_to=assigned_to,
                    scheduled_date=date,
                    estimated_duration_minutes=random.randint(45, 120),
                    actual_start_time=actual_start_time,
                    completion_time=completion_time,
                    estimated_completion=estimated_completion,
                    notes=random.choice([
                        'Standard cleaning required',
                        'Guest requested extra pillows',
                        'Deep cleaning needed',
                        'VIP guest - extra care',
                        'Check AC functionality',
                        ''
                    ]),
                    guest_requests=random.choice([
                        ['Extra towels'],
                        ['Late checkout'],
                        ['Extra pillows', 'Room service'],
                        []
                    ]),
                    maintenance_issues=random.choice([
                        [],
                        ['AC making noise'],
                        ['Leaky faucet'],
                        []
                    ]),
                    created_by=supervisor
                )

                # Add inspection data for completed tasks
                if status == 'CLEAN':
                    task.inspection_passed = True
                    task.inspector = inspector
                    task.inspection_notes = random.choice([
                        'Excellent work',
                        'Room ready for guest',
                        'All standards met',
                        'Outstanding cleanliness'
                    ])
                    task.inspection_time = completion_time + timedelta(minutes=10)
                    task.save()

                tasks_created += 1

                # Add amenity usage for completed or in-progress tasks
                if status in ['CLEANING', 'INSPECTING', 'CLEAN']:
                    # Add 3-7 amenity items per task
                    num_amenities = random.randint(3, 7)
                    selected_amenities = random.sample(amenities, min(num_amenities, len(amenities)))

                    for amenity in selected_amenities:
                        quantity = random.randint(1, 3)

                        AmenityUsage.objects.create(
                            housekeeping_task=task,
                            inventory_item=amenity,
                            quantity_used=quantity,
                            notes=f'Restocked during {task_type.lower().replace("_", " ")}',
                            recorded_by=assigned_to
                        )
                        amenity_usages_created += 1

        self.stdout.write(self.style.SUCCESS(f'✓ Created {tasks_created} housekeeping tasks'))
        self.stdout.write(self.style.SUCCESS(f'✓ Created {amenity_usages_created} amenity usage records'))
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(amenities)} amenity items'))
        self.stdout.write(self.style.SUCCESS('Housekeeping data seeding completed!'))
