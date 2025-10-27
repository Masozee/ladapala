from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Guest
from ..serializers import GuestSerializer, GuestListSerializer


class GuestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing guests"""
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_vip', 'nationality', 'gender']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    ordering_fields = ['first_name', 'last_name', 'created_at']
    ordering = ['first_name', 'last_name']

    def get_serializer_class(self):
        if self.action == 'list':
            return GuestListSerializer
        return GuestSerializer

    @action(detail=False, methods=['get'])
    def vip(self, request):
        """Get VIP guests"""
        vip_guests = self.get_queryset().filter(is_vip=True)
        serializer = GuestListSerializer(vip_guests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search_by_phone(self, request):
        """Search guest by phone number"""
        phone = request.query_params.get('phone')
        if not phone:
            return Response({'error': 'phone parameter is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        guests = self.get_queryset().filter(phone__icontains=phone)
        serializer = GuestListSerializer(guests, many=True)
        return Response(serializer.data)