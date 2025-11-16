"""
License validation utilities for the hotel management system
"""
from django.conf import settings

# HARDCODED EXPECTED LICENSE KEY
# This is the ONLY valid license key for this system
# Changing the .env file will not change this - it must match this exact value
EXPECTED_LICENSE_KEY = 'KL-U384T'


def get_expected_license_key() -> str:
    """
    Get the hardcoded expected license key.

    Returns:
        str: The hardcoded expected license key
    """
    return EXPECTED_LICENSE_KEY


def is_license_valid(license_key: str = None) -> bool:
    """
    Validate if the provided license key matches the hardcoded expected license.

    Args:
        license_key: The license key to validate. If None, uses settings.LICENSE_KEY

    Returns:
        bool: True if license is valid, False otherwise
    """
    if license_key is None:
        license_key = getattr(settings, 'LICENSE_KEY', '')

    # Must match the HARDCODED expected key
    return license_key == EXPECTED_LICENSE_KEY


def get_license_info() -> dict:
    """
    Get information about the current license.

    Returns:
        dict: License information including validity status
    """
    current_license = getattr(settings, 'LICENSE_KEY', '')
    is_valid = is_license_valid(current_license)

    return {
        'is_valid': is_valid,
        'license_key': current_license if is_valid else 'INVALID',
        'format': 'KL-XXXXX',
        'expected_format': True,
    }


def validate_license_or_raise():
    """
    Validate license and raise an exception if invalid.

    Raises:
        ValueError: If license is invalid
    """
    if not is_license_valid():
        raise ValueError(
            f"Invalid license key. Please check your LICENSE_KEY in settings. "
            f"Expected format: KL-XXXXX"
        )
