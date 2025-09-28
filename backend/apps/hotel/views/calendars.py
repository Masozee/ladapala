from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta

from ..models import Holiday
from ..serializers import HolidaySerializer, HolidayListSerializer


class HolidayViewSet(viewsets.ModelViewSet):
    """ViewSet for managing holidays"""
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['holiday_type', 'is_work_day', 'date']
    search_fields = ['name', 'name_id', 'description']
    ordering_fields = ['date', 'name', 'created_at']
    ordering = ['date']

    def get_serializer_class(self):
        if self.action == 'list':
            return HolidayListSerializer
        return HolidaySerializer

    @action(detail=False, methods=['get'])
    def current_year(self, request):
        """Get holidays for current year"""
        current_year = timezone.now().year
        holidays = self.get_queryset().filter(date__year=current_year)
        
        serializer = HolidayListSerializer(holidays, many=True)
        return Response({
            'year': current_year,
            'holidays': serializer.data
        })

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming holidays (next 3 months)"""
        today = timezone.now().date()
        three_months = today + timedelta(days=90)
        
        holidays = self.get_queryset().filter(
            date__gte=today,
            date__lte=three_months
        )
        
        serializer = HolidayListSerializer(holidays, many=True)
        return Response({
            'start_date': today,
            'end_date': three_months,
            'holidays': serializer.data
        })

    @action(detail=False, methods=['get'])
    def this_month(self, request):
        """Get holidays for current month"""
        today = timezone.now().date()
        holidays = self.get_queryset().filter(
            date__year=today.year,
            date__month=today.month
        )
        
        serializer = HolidayListSerializer(holidays, many=True)
        return Response({
            'month': today.month,
            'year': today.year,
            'holidays': serializer.data
        })