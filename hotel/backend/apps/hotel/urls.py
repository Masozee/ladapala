from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FinancialViewSet, FinancialTransactionViewSet, InvoiceViewSet
)

try:
    from .views import (
        RoomTypeViewSet, RoomViewSet, GuestViewSet, ReservationViewSet,
        PaymentViewSet, ComplaintViewSet, CheckInViewSet, HolidayViewSet,
        InventoryItemViewSet, hotel_dashboard
    )
    from .views.complaints import ComplaintImageViewSet
    from .views.housekeeping import HousekeepingTaskViewSet, AmenityUsageViewSet
    from .views.payments import AdditionalChargeViewSet
    from .views.reports import (
        daily_reports, daily_reports_range, monthly_reports,
        report_summary, available_reports, occupancy_report,
        revenue_report, guest_analytics_report, staff_performance_report,
        satisfaction_report, inventory_report, tax_report
    )
    from .views.analytics import dashboard_analytics, monthly_comparison
    from .views.financial import financial_overview, financial_transactions
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
    router.register(r'housekeeping-tasks', HousekeepingTaskViewSet, basename='hotel-housekeeping-tasks')
    router.register(r'amenity-usages', AmenityUsageViewSet, basename='hotel-amenity-usages')

urlpatterns = [
    path('', include(router.urls)),
]

# Add legacy URL patterns if views are available
if LEGACY_VIEWS:
    urlpatterns += [
        path('main/', hotel_dashboard, name='hotel-dashboard'),
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
        path('reports/inventory/', inventory_report, name='inventory-report'),
        path('reports/tax/', tax_report, name='tax-report'),
        path('analytics/dashboard/', dashboard_analytics, name='dashboard-analytics'),
        path('analytics/monthly-comparison/', monthly_comparison, name='monthly-comparison'),
        path('financial/overview/', financial_overview, name='financial-overview'),
        path('financial/transactions/', financial_transactions, name='financial-transactions'),
    ]
