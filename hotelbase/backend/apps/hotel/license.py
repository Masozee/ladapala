"""
License validation utilities for the hotelbase management system
"""
from django.conf import settings

# HARDCODED VALID LICENSE KEYS
# Only these keys are accepted - .env file must contain one of these
VALID_LICENSE_KEYS = [
    'KL-D326F',
    'KL-A829B',
    'KL-L492K',
    'KL-Q183Z',
    'KL-R740M',
    'KL-K915C',
    'KL-T083X',
    'KL-M672P',
    'KL-V230J',
    'KL-H558N',
    'KL-S904L',
    'KL-W742Q',
    'KL-B509E',
    'KL-U384T',
    'KL-C276Y',
    'KL-J831D',
]


def get_valid_license_keys() -> list:
    """
    Get the list of hardcoded valid license keys.

    Returns:
        list: List of valid license keys
    """
    return VALID_LICENSE_KEYS


def is_license_valid(license_key: str = None) -> bool:
    """
    Validate if the provided license key is in the list of valid keys.

    Args:
        license_key: The license key to validate. If None, uses settings.LICENSE_KEY

    Returns:
        bool: True if license is one of the valid keys, False otherwise
    """
    if license_key is None:
        license_key = getattr(settings, 'LICENSE_KEY', '')

    # Must match one of the HARDCODED valid keys
    return license_key in VALID_LICENSE_KEYS


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
        'total_valid_keys': len(VALID_LICENSE_KEYS),
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
            f"Must be one of {len(VALID_LICENSE_KEYS)} valid keys."
        )
