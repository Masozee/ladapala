'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAccessLevel, isAuthenticated, getDefaultRoute } from '@/lib/auth';

interface DepartmentGuardProps {
  children: React.ReactNode;
  requiredAccess?: 'office' | 'main' | 'support';
  fallbackPath?: string;
}

/**
 * DepartmentGuard component for protecting routes based on department access
 *
 * Usage:
 * <DepartmentGuard requiredAccess="office">
 *   <OfficeContent />
 * </DepartmentGuard>
 */
export default function DepartmentGuard({
  children,
  requiredAccess,
  fallbackPath,
}: DepartmentGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Get user's access level
    const access = getAccessLevel();

    if (!access) {
      // No access info, redirect to login
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // If no specific access required, just check authentication
    if (!requiredAccess) {
      setIsAuthorized(true);
      return;
    }

    // Check specific access level
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

    if (!hasAccess) {
      // User doesn't have required access, redirect to their default route
      const redirectTo = fallbackPath || getDefaultRoute();

      // Prevent redirect loop - only redirect if not already at the target
      if (pathname !== redirectTo) {
        console.log(`[DepartmentGuard] Access denied to ${pathname}. Redirecting to ${redirectTo}`);
        router.replace(redirectTo);
      }
      return;
    }

    setIsAuthorized(true);
  }, [pathname, requiredAccess, fallbackPath, router]);

  // Show loading state while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4E61D3] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authorized (redirect will happen)
  if (!isAuthorized) {
    return null;
  }

  // Render children if authorized
  return <>{children}</>;
}
