"""
Kitchen and Bar Order Ticket Generator
Generates PDF tickets for kitchen and bar staff when orders are confirmed
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from datetime import datetime
import os
from django.conf import settings


class KitchenTicketPDF:
    """Generate kitchen/bar order tickets in PDF format"""
    
    # Ticket size: 80mm width (thermal printer standard)
    TICKET_WIDTH = 80 * mm
    TICKET_HEIGHT = 297 * mm  # A4 height, will auto-size based on content
    
    def __init__(self, order, station='KITCHEN'):
        """
        Initialize ticket generator
        :param order: Order model instance
        :param station: 'KITCHEN' or 'BAR'
        """
        self.order = order
        self.station = station
        self.filename = self._generate_filename()
        self.filepath = self._get_filepath()
        
    def _generate_filename(self):
        """Generate unique filename for the ticket"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        station_prefix = 'kitchen' if self.station == 'KITCHEN' else 'bar'
        return f'{station_prefix}_order_{self.order.order_number}_{timestamp}.pdf'
    
    def _get_filepath(self):
        """Get full file path for saving PDF"""
        folder = 'kitchen_orders' if self.station == 'KITCHEN' else 'bar_orders'
        media_path = os.path.join(settings.MEDIA_ROOT, folder)
        os.makedirs(media_path, exist_ok=True)
        return os.path.join(media_path, self.filename)
    
    def _filter_items_by_station(self):
        """Filter order items based on station (kitchen or bar)"""
        items = []
        for item in self.order.items.all():
            product = item.product
            category_name = product.category.name.lower() if product.category else ''

            # Kitchen gets: Food items (nasi, sup, pembuka, pencuci mulut, sarapan, jajanan)
            # Bar gets: Beverage items (minuman)
            if self.station == 'KITCHEN':
                # Indonesian categories for food
                kitchen_keywords = ['nasi', 'makanan', 'sup', 'berkuah', 'pembuka', 'camilan',
                                   'pencuci mulut', 'sarapan', 'jajanan', 'utama', 'food',
                                   'appetizer', 'dessert', 'main']
                if any(keyword in category_name for keyword in kitchen_keywords):
                    items.append(item)
            elif self.station == 'BAR':
                # Indonesian categories for beverages
                beverage_keywords = ['minuman', 'beverage', 'drink', 'es', 'jus', 'kopi', 'teh']
                if any(keyword in category_name for keyword in beverage_keywords):
                    items.append(item)

        return items
    
    def generate(self):
        """Generate the PDF ticket"""
        items = self._filter_items_by_station()
        
        # If no items for this station, don't generate PDF
        if not items:
            return None
        
        # Create PDF
        c = canvas.Canvas(self.filepath, pagesize=(self.TICKET_WIDTH, self.TICKET_HEIGHT))
        
        # Starting Y position (from top)
        y = self.TICKET_HEIGHT - 10 * mm
        
        # Header - Station Name
        c.setFont("Helvetica-Bold", 16)
        station_text = "KITCHEN ORDER" if self.station == 'KITCHEN' else "BAR ORDER"
        c.drawCentredString(self.TICKET_WIDTH / 2, y, station_text)
        y -= 8 * mm
        
        # Separator line
        c.line(5 * mm, y, self.TICKET_WIDTH - 5 * mm, y)
        y -= 6 * mm
        
        # Order Info
        c.setFont("Helvetica-Bold", 12)
        c.drawString(5 * mm, y, f"Order: {self.order.order_number}")
        y -= 5 * mm
        
        # Table or Order Type
        if self.order.table:
            c.drawString(5 * mm, y, f"Table: {self.order.table.number}")
        else:
            c.drawString(5 * mm, y, f"Type: {self.order.order_type}")
        y -= 5 * mm
        
        # Time
        c.setFont("Helvetica", 10)
        order_time = self.order.created_at.strftime('%d/%m/%Y %H:%M')
        c.drawString(5 * mm, y, f"Time: {order_time}")
        y -= 7 * mm
        
        # Separator line
        c.line(5 * mm, y, self.TICKET_WIDTH - 5 * mm, y)
        y -= 6 * mm
        
        # Items Header
        c.setFont("Helvetica-Bold", 11)
        c.drawString(5 * mm, y, "Items:")
        y -= 5 * mm
        
        # Item List
        c.setFont("Helvetica", 10)
        for item in items:
            # Quantity x Product Name
            qty_text = f"{item.quantity}x"
            c.setFont("Helvetica-Bold", 11)
            c.drawString(5 * mm, y, qty_text)
            
            c.setFont("Helvetica", 11)
            product_name = item.product.name
            c.drawString(15 * mm, y, product_name)
            y -= 5 * mm
            
            # Notes (if any)
            if item.notes:
                c.setFont("Helvetica-Oblique", 9)
                # Wrap notes if too long
                notes = item.notes
                if len(notes) > 35:
                    # Split into multiple lines
                    words = notes.split()
                    line = ""
                    for word in words:
                        test_line = line + word + " "
                        if len(test_line) > 35:
                            c.drawString(10 * mm, y, f"  * {line.strip()}")
                            y -= 4 * mm
                            line = word + " "
                        else:
                            line = test_line
                    if line:
                        c.drawString(10 * mm, y, f"  * {line.strip()}")
                        y -= 4 * mm
                else:
                    c.drawString(10 * mm, y, f"  * {notes}")
                    y -= 4 * mm
                
                y -= 1 * mm  # Extra spacing after notes
        
        y -= 3 * mm
        
        # Separator line
        c.line(5 * mm, y, self.TICKET_WIDTH - 5 * mm, y)
        y -= 6 * mm
        
        # Order Notes (if any)
        if self.order.notes:
            c.setFont("Helvetica-Bold", 10)
            c.drawString(5 * mm, y, "Special Instructions:")
            y -= 4 * mm
            
            c.setFont("Helvetica", 9)
            notes = self.order.notes
            # Wrap notes
            if len(notes) > 40:
                words = notes.split()
                line = ""
                for word in words:
                    test_line = line + word + " "
                    if len(test_line) > 40:
                        c.drawString(5 * mm, y, line.strip())
                        y -= 4 * mm
                        line = word + " "
                    else:
                        line = test_line
                if line:
                    c.drawString(5 * mm, y, line.strip())
                    y -= 4 * mm
            else:
                c.drawString(5 * mm, y, notes)
                y -= 4 * mm
            
            y -= 3 * mm
        
        # Footer - Generated time
        y -= 5 * mm
        c.setFont("Helvetica", 8)
        gen_time = datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        c.drawCentredString(self.TICKET_WIDTH / 2, y, f"Generated: {gen_time}")
        
        # Save PDF
        c.save()
        
        return self.filepath


def generate_kitchen_bar_tickets(order):
    """
    Generate kitchen and/or bar tickets for an order
    Returns dict with paths to generated PDFs
    """
    results = {
        'kitchen_pdf': None,
        'bar_pdf': None,
        'success': False,
        'message': ''
    }
    
    try:
        # Generate kitchen ticket
        kitchen_ticket = KitchenTicketPDF(order, station='KITCHEN')
        kitchen_path = kitchen_ticket.generate()
        if kitchen_path:
            results['kitchen_pdf'] = kitchen_path
        
        # Generate bar ticket
        bar_ticket = KitchenTicketPDF(order, station='BAR')
        bar_path = bar_ticket.generate()
        if bar_path:
            results['bar_pdf'] = bar_path
        
        if kitchen_path or bar_path:
            results['success'] = True
            results['message'] = 'Tickets generated successfully'
        else:
            results['message'] = 'No items to print'
        
    except Exception as e:
        results['message'] = f'Error generating tickets: {str(e)}'
    
    return results
