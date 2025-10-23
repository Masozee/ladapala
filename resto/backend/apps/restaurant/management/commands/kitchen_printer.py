from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
import time
import sys
from apps.restaurant.models import KitchenOrder, Order, OrderItem
from apps.restaurant.services.kitchen_printer import KitchenTicketPrinter, KitchenOrderQueue


class Command(BaseCommand):
    help = 'Run the kitchen printer service to print orders for kitchen staff'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--branch',
            type=int,
            help='Branch ID to print orders for',
            required=True
        )
        parser.add_argument(
            '--mode',
            type=str,
            choices=['live', 'queue', 'test'],
            default='live',
            help='Mode to run the printer in (live: real-time printing, queue: show queue, test: print sample)'
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=10,
            help='Polling interval in seconds for live mode'
        )
        parser.add_argument(
            '--auto-print',
            action='store_true',
            help='Automatically print new orders without confirmation'
        )
    
    def __init__(self):
        super().__init__()
        self.printer = KitchenTicketPrinter()
        self.queue = KitchenOrderQueue()
        self.printed_orders = set()
    
    def handle(self, *args, **options):
        branch_id = options['branch']
        mode = options['mode']
        
        self.stdout.write(self.style.SUCCESS(f'Starting kitchen printer service for branch {branch_id}'))
        
        if mode == 'test':
            self.print_test_ticket()
        elif mode == 'queue':
            self.show_queue(branch_id)
        else:  # live mode
            self.run_live_printer(branch_id, options['interval'], options['auto_print'])
    
    def run_live_printer(self, branch_id, interval, auto_print):
        """Run the printer in live mode, checking for new orders periodically"""
        self.stdout.write(self.style.SUCCESS('Kitchen printer running in LIVE mode'))
        self.stdout.write(f'Polling every {interval} seconds for new orders...')
        self.stdout.write('Press Ctrl+C to stop\n')
        
        try:
            while True:
                # Get pending kitchen orders
                new_orders = self.get_pending_orders(branch_id)
                
                for kitchen_order in new_orders:
                    if kitchen_order.order.order_number not in self.printed_orders:
                        # Format order data
                        order_data = self.format_order_data(kitchen_order)
                        items = self.format_order_items(kitchen_order.order)
                        
                        # Print the ticket
                        ticket = self.printer.print_ticket(order_data, items)
                        
                        if auto_print:
                            self.print_ticket_to_console(ticket)
                            self.printed_orders.add(kitchen_order.order.order_number)
                            self.mark_as_printed(kitchen_order)
                        else:
                            self.stdout.write(self.style.WARNING(f'\nNew order: {kitchen_order.order.order_number}'))
                            self.print_ticket_to_console(ticket)
                            
                            response = input('Print this order? (y/n/q): ').lower()
                            if response == 'y':
                                self.printed_orders.add(kitchen_order.order.order_number)
                                self.mark_as_printed(kitchen_order)
                                self.stdout.write(self.style.SUCCESS('Order marked as printed'))
                            elif response == 'q':
                                self.stdout.write('Exiting...')
                                return
                
                # Show queue summary
                self.show_queue_summary(branch_id)
                
                # Wait before next check
                time.sleep(interval)
                
        except KeyboardInterrupt:
            self.stdout.write('\n' + self.style.SUCCESS('Kitchen printer service stopped'))
    
    def get_pending_orders(self, branch_id):
        """Get pending kitchen orders for the branch"""
        return KitchenOrder.objects.filter(
            order__branch_id=branch_id,
            status__in=['PENDING', 'PREPARING']
        ).select_related(
            'order', 'order__table', 'order__created_by__user'
        ).prefetch_related(
            'order__items__product'
        ).order_by('-priority', 'created_at')
    
    def format_order_data(self, kitchen_order):
        """Format kitchen order data for printing"""
        order = kitchen_order.order
        return {
            'order_number': order.order_number,
            'order_type': order.order_type,
            'table_number': order.table.number if order.table else None,
            'priority': kitchen_order.priority,
            'created_at': kitchen_order.created_at,
            'estimated_prep_time': self.calculate_prep_time(order),
            'notes': order.notes,
            'customer_name': order.customer_name,
            'customer_phone': order.customer_phone,
            'delivery_address': order.delivery_address,
            'created_by': order.created_by.user.get_full_name() if order.created_by else 'System'
        }
    
    def format_order_items(self, order):
        """Format order items for printing"""
        items = []
        for item in order.items.all():
            items.append({
                'quantity': item.quantity,
                'product_name': item.product.name,
                'notes': item.notes,
                'modifiers': []  # Can be extended to include modifiers
            })
        return items
    
    def calculate_prep_time(self, order):
        """Calculate estimated preparation time based on items"""
        max_prep_time = 15  # Default
        for item in order.items.all():
            if item.product.preparation_time > max_prep_time:
                max_prep_time = item.product.preparation_time
        return max_prep_time
    
    def mark_as_printed(self, kitchen_order):
        """Mark a kitchen order as printed/acknowledged"""
        if kitchen_order.status == 'PENDING':
            kitchen_order.status = 'PREPARING'
            kitchen_order.started_at = timezone.now()
            kitchen_order.save()
    
    def show_queue(self, branch_id):
        """Show the current order queue"""
        orders = self.get_pending_orders(branch_id)
        
        order_data_list = []
        for ko in orders:
            data = self.format_order_data(ko)
            order_data_list.append(data)
        
        summary = self.printer.print_summary_ticket(order_data_list)
        self.print_ticket_to_console(summary)
    
    def show_queue_summary(self, branch_id):
        """Show a brief queue summary"""
        pending_count = KitchenOrder.objects.filter(
            order__branch_id=branch_id,
            status='PENDING'
        ).count()
        
        preparing_count = KitchenOrder.objects.filter(
            order__branch_id=branch_id,
            status='PREPARING'
        ).count()
        
        self.stdout.write(
            f'\nQueue Status - Pending: {pending_count} | Preparing: {preparing_count}'
        )
    
    def print_test_ticket(self):
        """Print a sample ticket for testing"""
        sample_order = {
            'order_number': 'ORD20240101ABC123',
            'order_type': 'DINE_IN',
            'table_number': 'T5',
            'priority': 5,
            'created_at': datetime.now(),
            'estimated_prep_time': 20,
            'notes': 'No onions, extra spicy',
            'created_by': 'John Doe'
        }
        
        sample_items = [
            {
                'quantity': 2,
                'product_name': 'Grilled Chicken Burger',
                'notes': 'Well done',
                'modifiers': ['Extra cheese', 'No pickles']
            },
            {
                'quantity': 1,
                'product_name': 'Caesar Salad',
                'notes': 'Dressing on the side',
                'modifiers': []
            },
            {
                'quantity': 3,
                'product_name': 'French Fries',
                'notes': '',
                'modifiers': ['Extra crispy']
            }
        ]
        
        ticket = self.printer.print_ticket(sample_order, sample_items)
        self.print_ticket_to_console(ticket)
        
        self.stdout.write(self.style.SUCCESS('\nSample ticket printed successfully'))
    
    def print_ticket_to_console(self, ticket_text):
        """Print the ticket to console (simulating printer output)"""
        # Clear screen for better visibility (optional)
        # print('\033[2J\033[H')  # ANSI escape codes to clear screen
        
        # Print with box border for visibility
        print('\n' + '╔' + '═' * 42 + '╗')
        for line in ticket_text.split('\n'):
            if len(line) <= 40:
                print(f'║ {line:<40} ║')
            else:
                print(f'║ {line[:40]} ║')
        print('╚' + '═' * 42 + '╝\n')