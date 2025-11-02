'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import OfficeSidebar from './OfficeSidebar';
import DepartmentGuard from './DepartmentGuard';
import {
  Notification02Icon,
  Cancel01Icon,
  ChevronRightIcon,
  Logout01Icon,
  Clock01Icon,
  Calendar01Icon
} from '@/lib/icons';
import { buildApiUrl } from '@/lib/config';
import { useRouter } from 'next/navigation';

interface OfficeLayoutProps {
  children: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export const OfficeHeaderActions = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Get CSRF token from cookies
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const csrfToken = getCookie('csrftoken');

      const response = await fetch(buildApiUrl('user/logout/'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
      });

      if (response.ok) {
        // Clear any local storage
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        // Redirect to login page using window.location for full page reload
        window.location.href = '/login';
      } else {
        console.error('Logout failed:', response.status, await response.text());
        // Force logout on client side anyway
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on client side anyway
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Notifications */}
      <button className={`relative p-2 hover:bg-gray-100 transition-colors text-gray-600`}>
        <Notification02Icon className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center">
          2
        </span>
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className={`p-2 hover:bg-gray-100 transition-colors text-gray-600`}
        title="Keluar"
      >
        <Logout01Icon className="h-5 w-5" />
      </button>
    </div>
  );
};

const OfficeLayout = ({ children, breadcrumb }: OfficeLayoutProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const pathname = usePathname();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Generate default breadcrumb if not provided
  const defaultBreadcrumb = () => {
    const paths = pathname.split('/').filter(Boolean);
    const crumbs = [{ label: 'Kantor', href: '/office' }];
    
    // Skip the first 'office' segment since we already have it as root
    paths.slice(1).forEach((path, index) => {
      const href = '/office/' + paths.slice(1, index + 2).join('/');
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      crumbs.push({ label, href });
    });
    
    return crumbs;
  };

  const breadcrumbItems = breadcrumb || defaultBreadcrumb();

  return (
    <DepartmentGuard requiredAccess="office">
        <div className={`flex h-screen bg-gray-50`}>
          <OfficeSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navbar */}
          <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-b border-gray-200/50 h-16 flex items-center justify-between px-6">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm">
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />}
                  {item.href && index < breadcrumbItems.length - 1 ? (
                    <Link href={item.href} className="text-gray-600 hover:text-[#005357] transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={index === breadcrumbItems.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Side: Date/Time & Header Actions */}
            <div className="flex items-center space-x-6">
              {/* Today's Date & Time */}
              <div className="flex items-center space-x-3 text-sm text-gray-600 border-r border-gray-300 pr-6">
                <Calendar01Icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {currentTime.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock01Icon className="h-3 w-3" />
                    <span suppressHydrationWarning>
                      {currentTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <OfficeHeaderActions />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DepartmentGuard>
  );
};

export default OfficeLayout;