from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
import random
from decimal import Decimal

from apps.hotel.models import MaintenanceRequest, MaintenanceTechnician, Room


class Command(BaseCommand):
    help = 'Populate database with sample maintenance data for reports'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating maintenance technicians...'))
        
        # Create technicians
        technicians_data = [
            {
                'name': 'Ahmad Technical',
                'specializations': ['HVAC', 'Electrical'],
                'contact_number': '+62-812-3456-7890',
                'email': 'ahmad.tech@hotel.com'
            },
            {
                'name': 'Budi Elevator Tech',
                'specializations': ['Elevator', 'General'],
                'contact_number': '+62-813-4567-8901',
                'email': 'budi.elevator@hotel.com'
            },
            {
                'name': 'Joko Plumber',
                'specializations': ['Plumbing'],
                'contact_number': '+62-814-5678-9012',
                'email': 'joko.plumber@hotel.com'
            },
            {
                'name': 'IT Support Team',
                'specializations': ['IT/Network', 'Security'],
                'contact_number': '+62-815-6789-0123',
                'email': 'it.support@hotel.com'
            },
            {
                'name': 'General Maintenance',
                'specializations': ['General', 'Security'],
                'contact_number': '+62-816-7890-1234',
                'email': 'general.maintenance@hotel.com'
            }
        ]
        
        for tech_data in technicians_data:
            tech, created = MaintenanceTechnician.objects.get_or_create(
                name=tech_data['name'],
                defaults=tech_data
            )
            if created:
                self.stdout.write(f'Created technician: {tech.name}')
        
        self.stdout.write(self.style.SUCCESS('Creating maintenance requests...'))
        
        # Get some rooms for random assignment
        rooms = list(Room.objects.filter(is_active=True)[:20])
        technicians = list(MaintenanceTechnician.objects.filter(is_active=True))
        
        # Categories with realistic issues
        categories_issues = {
            'HVAC': [
                'Air conditioning not cooling properly',
                'Heating system malfunction',
                'Thermostat not responding',
                'Unusual noise from AC unit',
                'Poor air circulation in room'
            ],
            'Electrical': [
                'Power outlet not working',
                'Light fixtures flickering',
                'Circuit breaker tripping',
                'Faulty electrical switch',
                'LED lights need replacement'
            ],
            'Plumbing': [
                'Toilet not flushing properly',
                'Shower drain clogged',
                'Faucet dripping continuously',
                'Low water pressure',
                'Hot water not working'
            ],
            'Elevator': [
                'Elevator making strange noises',
                'Door not closing properly',
                'Elevator stuck between floors',
                'Button panel malfunction',
                'Emergency phone not working'
            ],
            'IT/Network': [
                'WiFi connection unstable',
                'TV not working',
                'Phone system down',
                'Internet speed very slow',
                'Network cable damaged'
            ],
            'General': [
                'Door handle loose',
                'Window blinds stuck',
                'Carpet stain removal needed',
                'Mirror needs cleaning',
                'Furniture repair required'
            ],
            'Security': [
                'Keycard reader malfunction',
                'Security camera not working',
                'Door lock mechanism faulty',
                'Alarm system false trigger',
                'Emergency exit light out'
            ]
        }
        
        # Generate requests for the last 30 days
        for days_back in range(30):
            target_date = timezone.now() - timedelta(days=days_back)
            
            # Generate 5-25 requests per day with some variation
            num_requests = random.randint(8, 18)
            
            for _ in range(num_requests):
                # Pick random category and issue
                category = random.choice(list(categories_issues.keys()))
                title = random.choice(categories_issues[category])
                
                # Pick technician based on specialization
                suitable_techs = [t for t in technicians if category in t.specializations]
                if not suitable_techs:
                    suitable_techs = technicians
                assigned_tech = random.choice(suitable_techs)
                
                # Random priority with weights (more medium, fewer urgent)
                priority_weights = [('LOW', 0.2), ('MEDIUM', 0.5), ('HIGH', 0.25), ('URGENT', 0.05)]
                priority = random.choices(
                    [p[0] for p in priority_weights],
                    weights=[p[1] for p in priority_weights]
                )[0]
                
                # Random status with most being completed for older requests
                if days_back > 7:
                    status_weights = [('COMPLETED', 0.85), ('IN_PROGRESS', 0.1), ('SUBMITTED', 0.05)]
                elif days_back > 3:
                    status_weights = [('COMPLETED', 0.7), ('IN_PROGRESS', 0.2), ('SUBMITTED', 0.1)]
                else:
                    status_weights = [('COMPLETED', 0.4), ('IN_PROGRESS', 0.4), ('SUBMITTED', 0.2)]
                
                status = random.choices(
                    [s[0] for s in status_weights],
                    weights=[s[1] for s in status_weights]
                )[0]
                
                # Random costs based on category
                cost_ranges = {
                    'HVAC': (150000, 2500000),  # IDR
                    'Electrical': (75000, 1500000),
                    'Plumbing': (100000, 800000),
                    'Elevator': (500000, 5000000),
                    'IT/Network': (50000, 1000000),
                    'General': (25000, 500000),
                    'Security': (200000, 3000000)
                }
                
                min_cost, max_cost = cost_ranges[category]
                actual_cost = Decimal(random.randint(min_cost, max_cost))
                estimated_cost = actual_cost * Decimal(random.uniform(0.8, 1.2))
                
                # Random time calculations
                request_time = target_date + timedelta(
                    hours=random.randint(6, 22),
                    minutes=random.randint(0, 59)
                )
                
                acknowledged_date = None
                started_date = None
                completed_date = None
                
                if status in ['ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED']:
                    acknowledged_date = request_time + timedelta(minutes=random.randint(15, 180))
                    
                if status in ['IN_PROGRESS', 'COMPLETED']:
                    started_date = acknowledged_date + timedelta(minutes=random.randint(30, 240))
                    
                if status == 'COMPLETED':
                    # Resolution time based on priority
                    resolution_hours = {
                        'URGENT': random.uniform(0.5, 4),
                        'HIGH': random.uniform(2, 12),
                        'MEDIUM': random.uniform(4, 48),
                        'LOW': random.uniform(12, 120)
                    }
                    completion_hours = resolution_hours[priority]
                    completed_date = started_date + timedelta(hours=completion_hours)
                
                # Customer satisfaction (higher for completed requests)
                customer_satisfaction = None
                if status == 'COMPLETED':
                    # Satisfaction based on resolution time and efficiency
                    base_satisfaction = random.uniform(3.5, 5.0)
                    if priority == 'URGENT' and completion_hours <= 2:
                        customer_satisfaction = min(5.0, base_satisfaction + 0.5)
                    elif priority == 'HIGH' and completion_hours <= 8:
                        customer_satisfaction = min(5.0, base_satisfaction + 0.3)
                    else:
                        customer_satisfaction = base_satisfaction
                    
                    customer_satisfaction = round(customer_satisfaction, 1)
                
                # Create the request
                MaintenanceRequest.objects.create(
                    room=random.choice(rooms) if rooms else None,
                    category=category,
                    priority=priority,
                    status=status,
                    source=random.choice(['GUEST_REQUEST', 'STAFF_REPORT', 'PREVENTIVE', 'INSPECTION']),
                    title=title,
                    description=f'Guest reported: {title.lower()}. Needs immediate attention.',
                    assigned_technician=assigned_tech.name,
                    requested_date=request_time,
                    acknowledged_date=acknowledged_date,
                    started_date=started_date,
                    completed_date=completed_date,
                    estimated_cost=estimated_cost,
                    actual_cost=actual_cost,
                    customer_satisfaction=customer_satisfaction
                )
        
        total_requests = MaintenanceRequest.objects.count()
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {total_requests} maintenance requests')
        )
        
        # Show some statistics
        self.stdout.write(self.style.SUCCESS('\n=== STATISTICS ==='))
        for category in categories_issues.keys():
            count = MaintenanceRequest.objects.filter(category=category).count()
            self.stdout.write(f'{category}: {count} requests')
        
        completed_count = MaintenanceRequest.objects.filter(status='COMPLETED').count()
        self.stdout.write(f'\nCompleted requests: {completed_count}/{total_requests}')
        
        self.stdout.write(self.style.SUCCESS('\nData population completed!'))