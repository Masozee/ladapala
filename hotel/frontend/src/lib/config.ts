// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  HOTEL_API_URL: process.env.NEXT_PUBLIC_HOTEL_API_URL || 'http://localhost:8000/api/hotel',
  DASHBOARD_API_URL: process.env.NEXT_PUBLIC_DASHBOARD_API_URL || 'http://localhost:8000/api/hotel/main',
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If it's a hotel-specific endpoint, use hotel API URL
  if (cleanEndpoint.startsWith('hotel/')) {
    return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
  }
  
  // For other endpoints, use base API URL
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

// Get CSRF token from cookies
export const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null;

  const name = 'csrftoken';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
};

// Default headers for API requests
export const getDefaultHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Referrer-Policy': 'no-referrer-when-downgrade',
  };

  // Add CSRF token if available
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }

  return headers;
};

// Helper function for API fetch requests with proper headers
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  const defaultHeaders = getDefaultHeaders();
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // Explicitly set referrer policy for cross-origin requests
    referrerPolicy: 'no-referrer-when-downgrade',
  };
  
  return fetch(url, config);
};

export default API_CONFIG;