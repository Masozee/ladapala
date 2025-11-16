/**
 * License validation utility
 * Validates the application license key against the backend
 *
 * IMPORTANT: The valid license key is HARDCODED in both frontend and backend.
 * The .env file must contain the exact hardcoded value to work.
 * Changing the .env to a different value will NOT work.
 */

const LICENSE_KEY = process.env.NEXT_PUBLIC_LICENSE_KEY || '';
// HARDCODED EXPECTED LICENSE KEY - must match backend
const EXPECTED_LICENSE_KEY = 'KL-U384T';

/**
 * Validate the license key matches the hardcoded expected value
 */
export function isLicenseValid(): boolean {
  return LICENSE_KEY === EXPECTED_LICENSE_KEY;
}

/**
 * Get the current license key
 */
export function getLicenseKey(): string {
  return LICENSE_KEY;
}

/**
 * Validate license with backend
 * This checks if the frontend license matches the backend license
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
  };
}
