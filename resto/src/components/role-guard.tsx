'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Array<'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'WAREHOUSE'>;
  requireStaff?: boolean;
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, requireStaff = true, fallback }: RoleGuardProps) {
  const router = useRouter();
  const { user, staff, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Card className="rounded-lg border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={24} strokeWidth={2} />
              Autentikasi Diperlukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Anda harus login untuk mengakses halaman ini.</p>
            <Button onClick={() => router.push('/login')} className="bg-red-600 hover:bg-red-700">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if staff access is required
  if (requireStaff && !staff) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Card className="rounded-lg border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={24} strokeWidth={2} />
              Akses Ditolak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Anda tidak memiliki akses sebagai staff untuk halaman ini.</p>
            <Button onClick={() => router.push('/')} variant="outline">
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has allowed role
  if (requireStaff && staff && !allowedRoles.includes(staff.role)) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Card className="rounded-lg border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={24} strokeWidth={2} />
              Akses Terbatas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Role Anda ({staff.role}) tidak memiliki akses ke halaman ini.
              Diperlukan: {allowedRoles.join(', ')}
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}
