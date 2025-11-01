from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import HotelSettings
from ..serializers import HotelSettingsSerializer


class HotelSettingsViewSet(viewsets.ViewSet):
    """
    ViewSet for managing hotel settings (singleton).
    Supports GET to retrieve settings and PATCH to update them.
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Get the hotel settings (singleton instance)"""
        settings = HotelSettings.load()
        serializer = HotelSettingsSerializer(settings)
        return Response(serializer.data)

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
