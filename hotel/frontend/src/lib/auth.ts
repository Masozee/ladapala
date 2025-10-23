export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface AuthEmployee {
  id: number;
  employee_id: string;
  full_name: string;
  position: string;
  department: {
    id: number;
    name: string;
  } | null;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('authUser');
  return userStr ? JSON.parse(userStr) : null;
}

export function getAuthEmployee(): AuthEmployee | null {
  if (typeof window === 'undefined') return null;
  const employeeStr = localStorage.getItem('authEmployee');
  return employeeStr ? JSON.parse(employeeStr) : null;
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  localStorage.removeItem('authEmployee');
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { 'Authorization': `Token ${token}` } : {};
}