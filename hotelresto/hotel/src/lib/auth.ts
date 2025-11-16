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

export interface AccessLevel {
  can_access_office: boolean;   // Management/Admin pages (/office)
  can_access_main: boolean;      // Front desk pages (/)
  can_access_support: boolean;   // Support staff pages (/support)
  department: string | null;
  department_id: number | null;
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

export function getAccessLevel(): AccessLevel | null {
  if (typeof window === 'undefined') return null;
  const accessStr = localStorage.getItem('authAccess');
  return accessStr ? JSON.parse(accessStr) : null;
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

export function canAccessOffice(): boolean {
  const access = getAccessLevel();
  return access?.can_access_office ?? false;
}

export function canAccessMain(): boolean {
  const access = getAccessLevel();
  return access?.can_access_main ?? false;
}

export function canAccessSupport(): boolean {
  const access = getAccessLevel();
  return access?.can_access_support ?? false;
}

export function getDefaultRoute(): string {
  const access = getAccessLevel();
  if (!access) return '/login';

  // Priority: main > office > support
  if (access.can_access_main) return '/';
  if (access.can_access_office) return '/office';
  if (access.can_access_support) return '/support';

  return '/login';
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  localStorage.removeItem('authEmployee');
  localStorage.removeItem('authAccess');
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { 'Authorization': `Token ${token}` } : {};
}