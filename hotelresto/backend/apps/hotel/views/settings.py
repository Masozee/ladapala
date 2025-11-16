from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from ..models import HotelSettings
from ..serializers import HotelSettingsSerializer


class HotelSettingsViewSet(viewsets.ViewSet):
    """
    ViewSet for managing hotel settings (singleton).
    Supports GET to retrieve settings and PATCH to update them.
    """
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """
        Allow public access to list/retrieve settings (for login page),
        but require authentication for updates
        """
        if self.action in ['list', 'public_info']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def list(self, request):
        """Get the hotel settings (singleton instance)"""
        settings = HotelSettings.load()
        serializer = HotelSettingsSerializer(settings)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_info(self, request):
        """Get public hotel information for login page (no auth required)"""
        settings = HotelSettings.load()
        return Response({
            'hotel_name': settings.hotel_name,
            'hotel_description': settings.hotel_description,
            'address': settings.address,
            'phone': settings.phone,
            'email': settings.email,
            'website': settings.website,
            'logo_url': settings.logo_url,
            'primary_color': settings.primary_color,
            'secondary_color': settings.secondary_color,
        })

    def partial_update(self, request, pk=None):
        """Update hotel settings (singleton instance)"""
        settings = HotelSettings.load()
        serializer = HotelSettingsSerializer(settings, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['patch'])
    def update_settings(self, request):
        """Alternative endpoint to update settings"""
        settings = HotelSettings.load()
        serializer = HotelSettingsSerializer(settings, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Settings updated successfully',
                'data': serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
