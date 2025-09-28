from django.core.management.base import BaseCommand
from django.db import transaction, models
from decimal import Decimal
from datetime import date, timedelta
import random
from apps.reports.models import DailyReport, MonthlyReport, OccupancyReport
from apps.rooms.models import Room, RoomType
from apps.reservations.models import Reservation


class Command(BaseCommand):
    help = 'Create seed data for reports app with Indonesian hotel metrics'

    def handle(self, *args, **options):
        self.stdout.write('Creating seed data for reports...')
        
        with transaction.atomic():
            today = date.today()
            total_rooms = Room.objects.count()
            
            # Create daily reports for past 30 days
            for day_offset in range(-30, 1):
                report_date = today + timedelta(days=day_offset)
                
                # Calculate occupancy for this date
                occupied_count = random.randint(int(total_rooms * 0.6), int(total_rooms * 0.95))
                maintenance_count = random.randint(1, 3)
                available_count = total_rooms - occupied_count - maintenance_count
                
                # Calculate revenue (Indonesian hotel rates)
                base_rate = Decimal('500000.00')  # Average room rate
                room_revenue = base_rate * occupied_count
                
                # Add variation based on day of week
                if report_date.weekday() >= 5:  # Weekend (Fri-Sat)
                    room_revenue = room_revenue * Decimal('1.2')  # 20% weekend premium
                
                # Food & beverage revenue (typically 30% of room revenue)
                fb_revenue = room_revenue * Decimal('0.30')
                
                # Other revenue (spa, laundry, etc.)
                other_revenue = room_revenue * Decimal('0.15')
                
                total_revenue = room_revenue + fb_revenue + other_revenue
                
                # Guest count
                total_guests = occupied_count + random.randint(0, 20)  # Some day visitors
                walk_ins = random.randint(0, 5)
                online_bookings = total_guests - walk_ins
                
                daily_report, created = DailyReport.objects.get_or_create(
                    report_date=report_date,
                    defaults={
                        'total_rooms': total_rooms,
                        'occupied_rooms': occupied_count,
                        'available_rooms': available_count,
                        'maintenance_rooms': maintenance_count,
                        'out_of_order_rooms': 0,
                        'total_revenue': total_revenue,
                        'room_revenue': room_revenue,
                        'food_beverage_revenue': fb_revenue,
                        'other_revenue': other_revenue,
                        'total_guests': total_guests,
                        'walk_in_guests': walk_ins,
                        'online_bookings': online_bookings
                    }
                )
                
                if created:
                    self.stdout.write(f'Created daily report for: {report_date}')

            # Create monthly reports for past 3 months
            for month_offset in range(-2, 1):
                report_month = (today.replace(day=1) + timedelta(days=32*month_offset)).replace(day=1)
                
                # Aggregate data from daily reports for this month
                month_start = report_month
                if month_offset == 0:
                    month_end = today
                else:
                    next_month = month_start.replace(day=28) + timedelta(days=4)
                    month_end = (next_month - timedelta(days=next_month.day))
                
                daily_reports = DailyReport.objects.filter(
                    report_date__gte=month_start,
                    report_date__lte=month_end
                )
                
                if daily_reports.exists():
                    # Aggregate revenue
                    monthly_revenue = daily_reports.aggregate(
                        total=models.Sum('total_revenue'),
                        room=models.Sum('room_revenue'),
                        fb=models.Sum('food_beverage_revenue'),
                        other=models.Sum('other_revenue')
                    )
                    
                    total_revenue = monthly_revenue['total'] or Decimal('0.00')
                    room_revenue = monthly_revenue['room'] or Decimal('0.00')
                    fb_revenue = monthly_revenue['fb'] or Decimal('0.00')
                    other_revenue_total = monthly_revenue['other'] or Decimal('0.00')
                    
                    # Calculate expenses (Indonesian hotel cost structure)
                    staff_costs = total_revenue * Decimal('0.25')  # 25% staff costs
                    utilities_costs = total_revenue * Decimal('0.08')  # 8% utilities
                    maintenance_costs = total_revenue * Decimal('0.05')  # 5% maintenance
                    marketing_costs = total_revenue * Decimal('0.03')  # 3% marketing
                    other_expenses = total_revenue * Decimal('0.07')  # 7% other
                    
                    total_expenses = (staff_costs + utilities_costs + 
                                    maintenance_costs + marketing_costs + other_expenses)
                    
                    # Calculate occupancy metrics
                    avg_occupancy = daily_reports.aggregate(
                        avg=models.Avg('occupied_rooms')
                    )['avg'] or 0
                    avg_occupancy_rate = Decimal(str(round((avg_occupancy / total_rooms) * 100, 2)))
                    
                    # Calculate ADR (Average Daily Rate)
                    total_room_nights = daily_reports.aggregate(
                        total=models.Sum('occupied_rooms')
                    )['total'] or 1
                    
                    avg_daily_rate = room_revenue / total_room_nights if total_room_nights else Decimal('0.00')
                    
                    # Total guests for the month
                    total_guests = daily_reports.aggregate(
                        total=models.Sum('total_guests')
                    )['total'] or 0
                    
                    monthly_report, created = MonthlyReport.objects.get_or_create(
                        year=report_month.year,
                        month=report_month.month,
                        defaults={
                            'total_revenue': total_revenue,
                            'room_revenue': room_revenue,
                            'food_beverage_revenue': fb_revenue,
                            'other_revenue': other_revenue_total,
                            'total_expenses': total_expenses,
                            'staff_costs': staff_costs,
                            'utilities_costs': utilities_costs,
                            'maintenance_costs': maintenance_costs,
                            'marketing_costs': marketing_costs,
                            'other_expenses': other_expenses,
                            'average_occupancy_rate': avg_occupancy_rate,
                            'average_daily_rate': avg_daily_rate,
                            'total_guests': total_guests,
                            'total_room_nights': total_room_nights
                        }
                    )
                    
                    if created:
                        self.stdout.write(f'Created monthly report for: {report_month.strftime("%B %Y")}')

            # Create occupancy reports by room type for past 7 days
            room_types = RoomType.objects.all()
            
            for day_offset in range(-7, 1):
                report_date = today + timedelta(days=day_offset)
                
                for room_type in room_types:
                    rooms_of_type = Room.objects.filter(room_type=room_type)
                    total_rooms_type = rooms_of_type.count()
                    
                    if total_rooms_type > 0:
                        # Random occupancy for this room type
                        occupied_rooms_type = random.randint(
                            int(total_rooms_type * 0.5), 
                            total_rooms_type
                        )
                        available_rooms_type = total_rooms_type - occupied_rooms_type
                        occupancy_rate = Decimal(str(round((occupied_rooms_type / total_rooms_type) * 100, 2)))
                        
                        # Revenue for this room type
                        room_revenue_type = room_type.base_price * occupied_rooms_type
                        avg_rate = room_type.base_price
                        
                        occupancy_report, created = OccupancyReport.objects.get_or_create(
                            report_date=report_date,
                            room_type=room_type.name,
                            defaults={
                                'total_rooms': total_rooms_type,
                                'occupied_rooms': occupied_rooms_type,
                                'available_rooms': available_rooms_type,
                                'occupancy_rate': occupancy_rate,
                                'room_revenue': room_revenue_type,
                                'average_rate': avg_rate
                            }
                        )
                        
                        if created:
                            self.stdout.write(f'Created occupancy report: {room_type.name} - {report_date}')

            total_daily = DailyReport.objects.count()
            total_monthly = MonthlyReport.objects.count()
            total_occupancy = OccupancyReport.objects.count()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created:\n'
                    f'- {total_daily} daily reports\n'
                    f'- {total_monthly} monthly reports\n'
                    f'- {total_occupancy} occupancy reports'
                )
            )