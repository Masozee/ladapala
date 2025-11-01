'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAccessLevel, isAuthenticated, getDefaultRoute } from '@/lib/auth';

/**
 * Hook to protect routes based on department access
 * Can be used in pages that don't use layout components
 *
 * @param requiredAccess - 'office' | 'main' | 'support' | undefined
 * @returns boolean indicating if user has access
 */
export function useRouteProtection(requiredAccess?: 'office' | 'main' | 'support'): boolean {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Get access level
    const access = getAccessLevel();

    if (!access) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // If no specific access required, authentication is enough
    if (!requiredAccess) {
      return;
    }

    // Check specific access
    let hasAccess = false;

    switch (requiredAccess) {
      case 'office':
        hasAccess = access.can_access_office;
        break;
      case 'main':
        hasAccess = access.can_access_main;
        break;
      case 'support':
        hasAccess = access.can_access_support;
        break;
    }

    // Redirect if no access
    if (!hasAccess) {
      const redirectTo = getDefaultRoute();
      if (pathname !== redirectTo) {
        console.log(`[useRouteProtection] Access denied to ${pathname}. Redirecting to ${redirectTo}`);
        router.replace(redirectTo);
      }
    }
  }, [pathname, requiredAccess, router]);

  // Return true if authenticated (component will be mounted)
  return isAuthenticated();
}

/**
 * Hook to check if user can access a specific route
 * Does not redirect, just returns boolean
 *
 * @param accessType - 'office' | 'main' | 'support'
 * @returns boolean indicating if user has access
 */
export function useHasAccess(accessType: 'office' | 'main' | 'support'): boolean {
  const access = getAccessLevel();

  if (!access) return false;

  switch (accessType) {
    case 'office':
      return access.can_access_office;
    case 'main':
      return access.can_access_main;
    case 'support':
      return access.can_access_support;
    default:
      return false;
  }
}
