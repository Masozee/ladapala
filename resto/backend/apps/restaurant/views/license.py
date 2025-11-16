"""
License validation API endpoints
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from ..license import is_license_valid, get_license_info


@api_view(['POST'])
def validate_license(request):
    """
    Validate a license key against the hardcoded valid keys.

    POST data:
        - license_key: The license key to validate

    Returns:
        JSON response with validation result
    """
    license_key = request.data.get('license_key', '')

    if not license_key:
        return Response(
            {'valid': False, 'error': 'License key is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    is_valid = is_license_valid(license_key)

    return Response({
        'valid': is_valid,
        'message': 'License key is valid' if is_valid else 'Invalid license key'
    })


@api_view(['GET'])
def get_license_status(request):
    """
    Get the current license status from settings.

    Returns:
        JSON response with license information
    """
    license_info = get_license_info()

    return Response({
        'status': 'valid' if license_info['is_valid'] else 'invalid',
        'info': license_info
    })
