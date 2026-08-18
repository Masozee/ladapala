import { getAuthToken } from './auth';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  HOTEL_API_URL: process.env.NEXT_PUBLIC_HOTEL_API_URL || 'http://localhost:8000/api/hotel',
  DASHBOARD_API_URL: process.env.NEXT_PUBLIC_DASHBOARD_API_URL || 'http://localhost:8000/api/hotel/main',
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  // If it's already a full URL, return as-is (for pagination URLs from API)
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // If it's a hotel-specific endpoint, use hotel API URL
  if (cleanEndpoint.startsWith('hotel/')) {
    return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
  }

  // For other endpoints, use base API URL
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

// CSRF token storage for cross-site requests
let csrfTokenCache: string | null = null;

// Get CSRF token from cookies (for same-origin) or cache (for cross-site)
export const getCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return csrfTokenCache;

  // Try to get from cookie first (same-origin)
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }

  // Fallback to cached token (cross-site)
  return csrfTokenCache;
};

// Set CSRF token for cross-site requests
export const setCsrfToken = (token: string) => {
  csrfTokenCache = token;
};

// Fetch and cache CSRF token from API
export const fetchCsrfToken = async (): Promise<string | null> => {
  try {
    const response = await apiFetch('user/csrf/', {
      credentials: 'include'
    });
    const data = await response.json();
    if (data.csrfToken) {
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    }
  } catch (err) {
    console.error('Error fetching CSRF token:', err);
  }
  return null;
};

// Default headers for API requests
export const getDefaultHeaders = (includeContentType: boolean = true): Record<string, string> => {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  // Token authentication — DRF TokenAuthentication runs before
  // SessionAuthentication, which skips the CSRF check entirely
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  // Add CSRF token if available (fallback for session-authenticated requests)
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }

  return headers;
};

// Helper function for API fetch requests with proper headers
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...getDefaultHeaders(!isFormData),
    ...(options.headers as Record<string, string> | undefined),
  };

  // Never set Content-Type for FormData — the browser must add the multipart boundary
  if (isFormData) {
    delete headers['Content-Type'];
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include cookies for session authentication
  };

  return fetch(url, config);
};

export default API_CONFIG;