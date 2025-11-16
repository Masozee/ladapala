from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FinancialViewSet, FinancialTransactionViewSet, InvoiceViewSet,
    system_resources, system_stats, process_list
)

try:
    from .views import (
        RoomTypeViewSet, RoomViewSet, GuestViewSet, ReservationViewSet,
        PaymentViewSet, ComplaintViewSet, CheckInViewSet, HolidayViewSet,
        InventoryItemViewSet, SupplierViewSet, hotel_dashboard,
        AmenityRequestViewSet, AmenityCategoryViewSet,
        EventPackageViewSet, FoodPackageViewSet, EventBookingViewSet, EventPaymentViewSet, EventAddOnViewSet
    )
    from .views.complaints import ComplaintImageViewSet
    from .views.housekeeping import HousekeepingTaskViewSet, AmenityUsageViewSet
    from .views.payments import AdditionalChargeViewSet
    from .views.warehouse import PurchaseOrderViewSet, PurchaseOrderItemViewSet, StockMovementViewSet
    from .views.stock_opname import StockOpnameViewSet, StockOpnameItemViewSet
    from .views.audit import WarehouseAuditLogViewSet
    from .views.maintenance import MaintenanceRequestViewSet, MaintenanceTechnicianViewSet
    from .views.settings import HotelSettingsViewSet
    from .views.sidebar_counts import sidebar_counts
    from .views.support_reports import support_analytics
    from .views.promotions import (
        VoucherViewSet, DiscountViewSet, LoyaltyProgramViewSet,
        GuestLoyaltyPointsViewSet, LoyaltyTransactionViewSet
    )
    from .views.reports import (
        daily_reports, daily_reports_range, monthly_reports,
        report_summary, available_reports, occupancy_report,
        revenue_report, guest_analytics_report, staff_performance_report,
        satisfaction_report, inventory_report, tax_report, maintenance_report
    )
    from .views.analytics import dashboard_analytics, monthly_comparison
    from .views.financial import financial_overview, financial_transactions, financial_invoices
    from .views.occupancy import occupancy_analytics
    from .views.lost_found import LostAndFoundViewSet
    from .views.wake_up_call import WakeUpCallViewSet
    from .views.department_inventory import DepartmentInventoryViewSet
    LEGACY_VIEWS = True
except ImportError:
    LEGACY_VIEWS = False

router = DefaultRouter()

# Financial endpoints
router.register(r'financial', FinancialViewSet, basename='hotel-financial')
router.register(r'transactions', FinancialTransactionViewSet, basename='hotel-transactions')
router.register(r'invoices', InvoiceViewSet, basename='hotel-invoices')

# Legacy endpoints
if LEGACY_VIEWS:
    router.register(r'room-types', RoomTypeViewSet, basename='hotel-room-types')
    router.register(r'rooms', RoomViewSet, basename='hotel-rooms')
    router.register(r'guests', GuestViewSet, basename='hotel-guests')
    router.register(r'reservations', ReservationViewSet, basename='hotel-reservations')
    router.register(r'payments', PaymentViewSet, basename='hotel-payments')
    router.register(r'additional-charges', AdditionalChargeViewSet, basename='hotel-additional-charges')
    router.register(r'complaints', ComplaintViewSet, basename='hotel-complaints')
    router.register(r'complaint-images', ComplaintImageViewSet, basename='hotel-complaint-images')
    router.register(r'checkins', CheckInViewSet, basename='hotel-checkins')
    router.register(r'holidays', HolidayViewSet, basename='hotel-holidays')
    router.register(r'inventory', InventoryItemViewSet, basename='hotel-inventory')
    router.register(r'purchase-orders', PurchaseOrderViewSet, basename='hotel-purchase-orders')
    router.register(r'purchase-order-items', PurchaseOrderItemViewSet, basename='hotel-purchase-order-items')
    router.register(r'stock-movements', StockMovementViewSet, basename='hotel-stock-movements')
    router.register(r'suppliers', SupplierViewSet, basename='hotel-suppliers')
    router.register(r'housekeeping-tasks', HousekeepingTaskViewSet, basename='hotel-housekeeping-tasks')
    router.register(r'amenity-usages', AmenityUsageViewSet, basename='hotel-amenity-usages')
    router.register(r'amenity-requests', AmenityRequestViewSet, basename='hotel-amenity-requests')
    router.register(r'amenity-categories', AmenityCategoryViewSet, basename='hotel-amenity-categories')
    router.register(r'maintenance-requests', MaintenanceRequestViewSet, basename='hotel-maintenance-requests')
    router.register(r'maintenance-technicians', MaintenanceTechnicianViewSet, basename='hotel-maintenance-technicians')
    router.register(r'settings', HotelSettingsViewSet, basename='hotel-settings')
    router.register(r'vouchers', VoucherViewSet, basename='hotel-vouchers')
    router.register(r'discounts', DiscountViewSet, basename='hotel-discounts')
    router.register(r'loyalty-program', LoyaltyProgramViewSet, basename='hotel-loyalty-program')
    router.register(r'loyalty-points', GuestLoyaltyPointsViewSet, basename='hotel-loyalty-points')
    router.register(r'loyalty-transactions', LoyaltyTransactionViewSet, basename='hotel-loyalty-transactions')
    router.register(r'event-packages', EventPackageViewSet, basename='hotel-event-packages')
    router.register(r'food-packages', FoodPackageViewSet, basename='hotel-food-packages')
    router.register(r'event-bookings', EventBookingViewSet, basename='hotel-event-bookings')
    router.register(r'event-payments', EventPaymentViewSet, basename='hotel-event-payments')
    router.register(r'event-addons', EventAddOnViewSet, basename='hotel-event-addons')
    router.register(r'stock-opnames', StockOpnameViewSet, basename='hotel-stock-opnames')
    router.register(r'stock-opname-items', StockOpnameItemViewSet, basename='hotel-stock-opname-items')
    router.register(r'warehouse-audit', WarehouseAuditLogViewSet, basename='hotel-warehouse-audit')
    router.register(r'lost-and-found', LostAndFoundViewSet, basename='hotel-lost-and-found')
    router.register(r'wake-up-calls', WakeUpCallViewSet, basename='hotel-wake-up-calls')
    router.register(r'department-inventory', DepartmentInventoryViewSet, basename='hotel-department-inventory')

urlpatterns = [
    path('', include(router.urls)),
    # System monitoring endpoints
    path('system/resources/', system_resources, name='system-resources'),
    path('system/stats/', system_stats, name='system-stats'),
    path('system/processes/', process_list, name='process-list'),
]

# Add legacy URL patterns if views are available
if LEGACY_VIEWS:
    urlpatterns += [
        path('main/', hotel_dashboard, name='hotel-dashboard'),
        path('sidebar-counts/', sidebar_counts, name='sidebar-counts'),
        path('support/analytics/', support_analytics, name='support-analytics'),
        path('reports/daily/', daily_reports, name='daily-reports'),
        path('reports/daily-range/', daily_reports_range, name='daily-reports-range'),
        path('reports/monthly/', monthly_reports, name='monthly-reports'),
        path('reports/summary/', report_summary, name='report-summary'),
        path('reports/available/', available_reports, name='available-reports'),
        path('reports/occupancy/', occupancy_report, name='occupancy-report'),
        path('reports/revenue/', revenue_report, name='revenue-report'),
        path('reports/guest-analytics/', guest_analytics_report, name='guest-analytics-report'),
        path('reports/staff-performance/', staff_performance_report, name='staff-performance-report'),
        path('reports/satisfaction/', satisfaction_report, name='satisfaction-report'),
        path('reports/maintenance/', maintenance_report, name='maintenance-report'),
        path('reports/inventory/', inventory_report, name='inventory-report'),
        path('reports/tax/', tax_report, name='tax-report'),
        path('analytics/dashboard/', dashboard_analytics, name='dashboard-analytics'),
        path('analytics/monthly-comparison/', monthly_comparison, name='monthly-comparison'),
        path('analytics/occupancy/', occupancy_analytics, name='occupancy-analytics'),
        path('financial/overview/', financial_overview, name='financial-overview'),
        path('financial/transactions/', financial_transactions, name='financial-transactions'),
        path('financial/invoices/', financial_invoices, name='financial-invoices'),
    ]
