import django_filters
from django.db.models import Q
from .models import Complaint, ComplaintCategory
from apps.employees.models import Employee, Department


class ComplaintFilter(django_filters.FilterSet):
    """Advanced filtering for complaints"""
    
    # Status filters
    status = django_filters.MultipleChoiceFilter(
        choices=Complaint.STATUS_CHOICES,
        field_name='status',
        lookup_expr='in'
    )
    
    # Priority filters
    priority = django_filters.MultipleChoiceFilter(
        choices=Complaint.PRIORITY_CHOICES,
        field_name='priority',
        lookup_expr='in'
    )
    
    # Category filter
    category = django_filters.ModelMultipleChoiceFilter(
        queryset=ComplaintCategory.objects.filter(is_active=True),
        field_name='category',
        to_field_name='id'
    )
    
    # Assignment filters
    assigned_to = django_filters.ModelMultipleChoiceFilter(
        queryset=Employee.objects.filter(is_active=True),
        field_name='assigned_to',
        to_field_name='id'
    )
    
    assigned_department = django_filters.ModelMultipleChoiceFilter(
        queryset=Department.objects.filter(is_active=True),
        field_name='assigned_department',
        to_field_name='id'
    )
    
    unassigned = django_filters.BooleanFilter(
        method='filter_unassigned',
        label='Unassigned complaints'
    )
    
    # Date filters
    created_date = django_filters.DateFromToRangeFilter(
        field_name='created_at',
        label='Created date range'
    )
    
    incident_date = django_filters.DateFromToRangeFilter(
        field_name='incident_date',
        label='Incident date range'
    )
    
    resolved_date = django_filters.DateFromToRangeFilter(
        field_name='resolved_at',
        label='Resolved date range'
    )
    
    # Guest filters
    guest_id = django_filters.NumberFilter(
        field_name='guest__id',
        lookup_expr='exact'
    )
    
    guest_email = django_filters.CharFilter(
        field_name='guest__email',
        lookup_expr='icontains'
    )
    
    guest_name = django_filters.CharFilter(
        method='filter_guest_name',
        label='Guest name'
    )
    
    # Room filter
    room_number = django_filters.CharFilter(
        field_name='room_number',
        lookup_expr='icontains'
    )
    
    # Source filter
    source = django_filters.MultipleChoiceFilter(
        choices=Complaint.SOURCE_CHOICES,
        field_name='source',
        lookup_expr='in'
    )
    
    # Special filters
    is_escalated = django_filters.BooleanFilter(
        field_name='is_escalated'
    )
    
    follow_up_required = django_filters.BooleanFilter(
        field_name='follow_up_required'
    )
    
    is_anonymous = django_filters.BooleanFilter(
        field_name='is_anonymous'
    )
    
    # Satisfaction rating filter
    satisfaction_rating = django_filters.RangeFilter(
        field_name='guest_satisfaction_rating'
    )
    
    # Search filter
    search = django_filters.CharFilter(
        method='filter_search',
        label='Search in title, description, and complaint number'
    )

    class Meta:
        model = Complaint
        fields = {
            'complaint_number': ['exact', 'icontains'],
            'title': ['icontains'],
            'description': ['icontains'],
        }

    def filter_unassigned(self, queryset, name, value):
        """Filter unassigned complaints"""
        if value:
            return queryset.filter(
                Q(assigned_to__isnull=True) & Q(assigned_department__isnull=True)
            )
        return queryset

    def filter_guest_name(self, queryset, name, value):
        """Filter by guest name (first or last name)"""
        return queryset.filter(
            Q(guest__first_name__icontains=value) |
            Q(guest__last_name__icontains=value)
        )

    def filter_search(self, queryset, name, value):
        """Search across multiple fields"""
        return queryset.filter(
            Q(complaint_number__icontains=value) |
            Q(title__icontains=value) |
            Q(description__icontains=value) |
            Q(guest__first_name__icontains=value) |
            Q(guest__last_name__icontains=value) |
            Q(guest__email__icontains=value) |
            Q(room_number__icontains=value)
        )