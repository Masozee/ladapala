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

export default API_CONFIG;