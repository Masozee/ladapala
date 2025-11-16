"""
License validation API views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from ..license import is_license_valid, get_license_info


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_license(request):
    """
    Validate a license key against the backend.

    POST data:
        - license_key: The license key to validate

    Returns:
        - valid: boolean indicating if the license is valid
        - message: status message
    """
    license_key = request.data.get('license_key', '')

    if not license_key:
        return Response(
            {'valid': False, 'message': 'License key is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    is_valid = is_license_valid(license_key)

    if is_valid:
        return Response({
            'valid': True,
            'message': 'License key is valid'
        })
    else:
        return Response({
            'valid': False,
            'message': 'Invalid license key'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_license_status(request):
    """
    Get the current license status from the backend.

    Returns:
        - License information and validity status
    """
    license_info = get_license_info()

    return Response({
        'valid': license_info['is_valid'],
        'format': license_info['format'],
        'has_license': bool(getattr(settings, 'LICENSE_KEY', ''))
    })
