from datetime import datetime
from typing import List, Dict, Any
import textwrap
from decimal import Decimal
from django.utils import timezone


class KitchenTicketPrinter:
    """
    Service to format and print kitchen orders for the kitchen staff.
    Orders are printed with priority information to help kitchen know which to serve first.
    """
    
    TICKET_WIDTH = 40
    SEPARATOR = "=" * TICKET_WIDTH
    DASH_LINE = "-" * TICKET_WIDTH
    
    def __init__(self):
        self.ticket_counter = 0
    
    def format_header(self, order_data: Dict[str, Any]) -> str:
        """Format the ticket header with order information"""
        header_lines = []
        
        # Restaurant header
        header_lines.append(self.SEPARATOR)
        header_lines.append(self.center_text("KITCHEN ORDER"))
        header_lines.append(self.SEPARATOR)
        
        # Order number and type
        order_number = order_data.get('order_number', 'N/A')
        order_type = order_data.get('order_type', 'DINE_IN')
        header_lines.append(f"ORDER #: {order_number}")
        header_lines.append(f"TYPE: {order_type}")
        
        # Table number for dine-in orders
        if order_type == 'DINE_IN' and order_data.get('table_number'):
            header_lines.append(f"TABLE: {order_data['table_number']}")
        
        # Priority and timing
        priority = order_data.get('priority', 0)
        priority_text = self.get_priority_text(priority)
        header_lines.append(f"PRIORITY: {priority_text}")
        
        # Time information
        order_time = order_data.get('created_at', datetime.now())
        if isinstance(order_time, str):
            order_time = datetime.fromisoformat(order_time.replace('Z', '+00:00'))
        header_lines.append(f"TIME: {order_time.strftime('%H:%M:%S')}")
        
        # Estimated preparation time
        prep_time = order_data.get('estimated_prep_time', 15)
        header_lines.append(f"PREP TIME: {prep_time} mins")
        
        header_lines.append(self.DASH_LINE)
        
        return '\n'.join(header_lines)
    
    def format_items(self, items: List[Dict[str, Any]]) -> str:
        """Format the order items for kitchen display"""
        item_lines = []
        
        for item in items:
            quantity = item.get('quantity', 1)
            product_name = item.get('product_name', 'Unknown Item')
            notes = item.get('notes', '')
            
            # Main item line with quantity
            item_line = f"{quantity}x {product_name}"
            item_lines.append(item_line.upper())
            
            # Add notes if present
            if notes:
                wrapped_notes = textwrap.wrap(f"  Note: {notes}", 
                                             width=self.TICKET_WIDTH - 2)
                item_lines.extend(wrapped_notes)
            
            # Add modifiers if present
            modifiers = item.get('modifiers', [])
            for modifier in modifiers:
                item_lines.append(f"  - {modifier}")
        
        return '\n'.join(item_lines)
    
    def format_footer(self, order_data: Dict[str, Any]) -> str:
        """Format the ticket footer with additional instructions"""
        footer_lines = []
        
        footer_lines.append(self.DASH_LINE)
        
        # Special instructions
        if order_data.get('notes'):
            footer_lines.append("SPECIAL INSTRUCTIONS:")
            wrapped_notes = textwrap.wrap(order_data['notes'], 
                                         width=self.TICKET_WIDTH)
            footer_lines.extend(wrapped_notes)
            footer_lines.append(self.DASH_LINE)
        
        # Customer information for takeaway/delivery
        if order_data.get('order_type') in ['TAKEAWAY', 'DELIVERY']:
            if order_data.get('customer_name'):
                footer_lines.append(f"CUSTOMER: {order_data['customer_name']}")
            if order_data.get('customer_phone'):
                footer_lines.append(f"PHONE: {order_data['customer_phone']}")
        
        # Delivery address
        if order_data.get('order_type') == 'DELIVERY' and order_data.get('delivery_address'):
            footer_lines.append("DELIVERY TO:")
            wrapped_address = textwrap.wrap(order_data['delivery_address'], 
                                           width=self.TICKET_WIDTH)
            footer_lines.extend(wrapped_address)
        
        # Server/cashier information
        if order_data.get('created_by'):
            footer_lines.append(self.DASH_LINE)
            footer_lines.append(f"SERVER: {order_data['created_by']}")
        
        footer_lines.append(self.SEPARATOR)
        
        return '\n'.join(footer_lines)
    
    def center_text(self, text: str) -> str:
        """Center text within the ticket width"""
        return text.center(self.TICKET_WIDTH)
    
    def get_priority_text(self, priority: int) -> str:
        """Convert priority number to text description"""
        if priority >= 10:
            return f"⚡ RUSH ({priority})"
        elif priority >= 5:
            return f"🔥 HIGH ({priority})"
        elif priority > 0:
            return f"📍 NORMAL ({priority})"
        else:
            return "STANDARD"
    
    def print_ticket(self, order_data: Dict[str, Any], items: List[Dict[str, Any]]) -> str:
        """
        Generate a complete kitchen ticket for printing.
        
        Args:
            order_data: Dictionary containing order information
            items: List of order items with details
            
        Returns:
            Formatted ticket string ready for printing
        """
        ticket_parts = []
        
        # Add header
        ticket_parts.append(self.format_header(order_data))
        
        # Add items
        ticket_parts.append(self.format_items(items))
        
        # Add footer
        ticket_parts.append(self.format_footer(order_data))
        
        # Add cut line for printer
        ticket_parts.append("\n" * 3)
        ticket_parts.append("." * self.TICKET_WIDTH)
        ticket_parts.append("CUT HERE")
        ticket_parts.append("." * self.TICKET_WIDTH)
        ticket_parts.append("\n" * 2)
        
        return '\n'.join(ticket_parts)
    
    def print_summary_ticket(self, orders: List[Dict[str, Any]]) -> str:
        """
        Print a summary of pending orders for kitchen display.
        Shows order queue with priorities.
        """
        summary_lines = []
        
        summary_lines.append(self.SEPARATOR)
        summary_lines.append(self.center_text("KITCHEN ORDER QUEUE"))
        summary_lines.append(self.center_text(datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        summary_lines.append(self.SEPARATOR)
        
        # Sort orders by priority and time
        sorted_orders = sorted(orders, 
                              key=lambda x: (-x.get('priority', 0), 
                                           x.get('created_at', '')))
        
        if not sorted_orders:
            summary_lines.append(self.center_text("No pending orders"))
        else:
            summary_lines.append(f"{'#':<8} {'TYPE':<10} {'TABLE':<6} {'TIME':<8} {'PRI':<4}")
            summary_lines.append(self.DASH_LINE)
            
            for order in sorted_orders[:20]:  # Show max 20 orders
                order_num = order.get('order_number', 'N/A')[-7:]  # Get last 7 characters
                order_type = order.get('order_type', 'N/A')[:9]
                table = str(order.get('table_number', '-'))[:5]
                
                order_time = order.get('created_at', datetime.now())
                if isinstance(order_time, str):
                    order_time = datetime.fromisoformat(order_time.replace('Z', '+00:00'))
                time_str = order_time.strftime('%H:%M')
                
                priority = order.get('priority', 0)
                
                line = f"{order_num:<8} {order_type:<10} {table:<6} {time_str:<8} {priority:<4}"
                summary_lines.append(line)
        
        summary_lines.append(self.SEPARATOR)
        summary_lines.append(f"Total pending: {len(sorted_orders)} orders")
        summary_lines.append(self.SEPARATOR)
        
        return '\n'.join(summary_lines)


class KitchenOrderQueue:
    """
    Manages the queue of kitchen orders with priority-based serving order.
    """
    
    def __init__(self):
        self.orders = []
    
    def add_order(self, order: Dict[str, Any]) -> None:
        """Add an order to the queue"""
        # Calculate dynamic priority based on various factors
        priority = self.calculate_priority(order)
        order['calculated_priority'] = priority
        self.orders.append(order)
    
    def calculate_priority(self, order: Dict[str, Any]) -> int:
        """
        Calculate order priority based on multiple factors:
        - Base priority from order
        - Time waiting (increases priority over time)
        - Order type (dine-in might have higher priority)
        - Special flags (rush orders, VIP, etc.)
        """
        base_priority = order.get('priority', 0)
        
        # Add priority based on waiting time (1 point per 5 minutes)
        created_at = order.get('created_at', datetime.now())
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        
        wait_time = (timezone.now() - created_at).total_seconds() / 60
        time_priority = int(wait_time / 5)
        
        # Order type priority
        type_priority = {
            'DINE_IN': 2,
            'TAKEAWAY': 1,
            'DELIVERY': 0
        }.get(order.get('order_type', 'DINE_IN'), 0)
        
        # VIP or rush order bonus
        if order.get('is_rush'):
            base_priority += 10
        if order.get('is_vip'):
            base_priority += 5
        
        return base_priority + time_priority + type_priority
    
    def get_next_order(self) -> Dict[str, Any]:
        """Get the next order to prepare based on priority"""
        if not self.orders:
            return None
        
        # Recalculate priorities before selecting
        for order in self.orders:
            order['calculated_priority'] = self.calculate_priority(order)
        
        # Sort by priority (highest first) and get the first one
        self.orders.sort(key=lambda x: -x.get('calculated_priority', 0))
        
        return self.orders[0]
    
    def remove_order(self, order_number: str) -> bool:
        """Remove a completed order from the queue"""
        initial_length = len(self.orders)
        self.orders = [o for o in self.orders if o.get('order_number') != order_number]
        return len(self.orders) < initial_length
    
    def get_queue_status(self) -> List[Dict[str, Any]]:
        """Get the current queue status with calculated priorities"""
        for order in self.orders:
            order['calculated_priority'] = self.calculate_priority(order)
        
        return sorted(self.orders, key=lambda x: -x.get('calculated_priority', 0))