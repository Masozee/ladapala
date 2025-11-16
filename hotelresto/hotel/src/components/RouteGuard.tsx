'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAccessLevel, isAuthenticated, getDefaultRoute } from '@/lib/auth';

/**
 * Global route guard component
 * Checks every route change and redirects if user doesn't have access
 */
export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Skip check for login page and public routes
    if (pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
      return;
    }

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

    // Determine required access based on pathname
    let requiredAccess: 'office' | 'main' | 'support' | null = null;
    let hasAccess = true;

    if (pathname.startsWith('/office')) {
      requiredAccess = 'office';
      hasAccess = access.can_access_office;
    } else if (pathname.startsWith('/support')) {
      requiredAccess = 'support';
      hasAccess = access.can_access_support;
    } else if (pathname === '/' ||
               pathname.startsWith('/rooms') ||
               pathname.startsWith('/reservations') ||
               pathname.startsWith('/bookings') ||
               pathname.startsWith('/guests') ||
               pathname.startsWith('/calendar') ||
               pathname.startsWith('/payments') ||
               pathname.startsWith('/complaints') ||
               pathname.startsWith('/profile')) {
      // Main/front desk pages
      requiredAccess = 'main';
      hasAccess = access.can_access_main;
    }

    // Redirect if no access
    if (!hasAccess && requiredAccess) {
      const defaultRoute = getDefaultRoute();
      if (pathname !== defaultRoute) {
        console.log(`[RouteGuard] Access denied to ${pathname} (requires ${requiredAccess}). Redirecting to ${defaultRoute}`);
        router.replace(defaultRoute);
      }
    }
  }, [pathname, router]);

  return <>{children}</>;
}
