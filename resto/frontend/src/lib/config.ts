export const getCsrfToken = (): string | null => {
  const name = 'csrftoken'
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

export const buildApiUrl = (endpoint: string): string => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  // Remove trailing slash from API_URL if present
  const cleanApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
  return `${cleanApiUrl}/${cleanEndpoint}`
}
