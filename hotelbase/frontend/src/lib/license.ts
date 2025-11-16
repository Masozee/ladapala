/**
 * License validation utility for hotelbase
 * Validates the application license key against the backend
 *
 * IMPORTANT: The valid license keys are HARDCODED in the backend.
 * The .env file must contain one of the 18 valid license keys.
 * Changing the .env to a different value will NOT work unless it's one of the valid keys.
 *
 * Valid Keys: KL-D326F, KL-A829B, KL-L492K, KL-Q183Z, KL-R740M, KL-K915C,
 *             KL-T083X, KL-M672P, KL-V230J, KL-H558N, KL-S904L, KL-G117R,
 *             KL-P663U, KL-W742Q, KL-B509E, KL-U384T, KL-C276Y, KL-J831D
 */

const LICENSE_KEY = process.env.NEXT_PUBLIC_LICENSE_KEY || '';

// HARDCODED VALID LICENSE KEYS - must match backend
const VALID_LICENSE_KEYS = [
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
  'KL-G117R',
  'KL-P663U',
  'KL-W742Q',
  'KL-B509E',
  'KL-U384T',
  'KL-C276Y',
  'KL-J831D',
];

/**
 * Validate the license key matches one of the hardcoded valid values
 */
export function isLicenseValid(): boolean {
  return VALID_LICENSE_KEYS.includes(LICENSE_KEY);
}

/**
 * Get the current license key
 */
export function getLicenseKey(): string {
  return LICENSE_KEY;
}

/**
 * Get all valid license keys
 */
export function getValidLicenseKeys(): string[] {
  return VALID_LICENSE_KEYS;
}

/**
 * Validate license with backend
 * This checks if the frontend license matches the backend's valid keys
 */
export async function validateLicenseWithBackend(apiBaseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiBaseUrl}/validate-license/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ license_key: LICENSE_KEY }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('License validation failed:', error);
    return false;
  }
}

/**
 * Get license information
 */
export function getLicenseInfo() {
  return {
    key: LICENSE_KEY,
    isValid: isLicenseValid(),
    hasLicense: LICENSE_KEY.length > 0,
    totalValidKeys: VALID_LICENSE_KEYS.length,
  };
}
