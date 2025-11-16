'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from './Sidebar';
import DepartmentGuard from './DepartmentGuard';
import { buildApiUrl } from '@/lib/config';
import {
  Notification02Icon,
  ChevronRightIcon,
  UserCheckIcon,
  Logout01Icon,
  Calendar01Icon,
  Clock01Icon
} from '@/lib/icons';

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export const HeaderActions = () => {
  return (
    <div className="flex items-center space-x-4">
      {/* Notifications */}
      <button className="relative p-2 hover:bg-gray-100 transition-colors text-gray-600">
        <Notification02Icon className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center">
          3
        </span>
      </button>

      {/* Logout Button */}
      <button
        onClick={async () => {
          try {
            // Get CSRF token from cookies
            const getCookie = (name: string) => {
              const value = `; ${document.cookie}`;
              const parts = value.split(`; ${name}=`);
              if (parts.length === 2) return parts.pop()?.split(';').shift();
              return null;
            };

            const csrfToken = getCookie('csrftoken');

            // Call logout API
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
              // Redirect to login
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
        }}
        className="p-2 hover:bg-red-100 transition-colors text-red-600"
        title="Logout"
      >
        <Logout01Icon className="h-5 w-5" />
      </button>
    </div>
  );
};

const AppLayout = ({ children, breadcrumb }: AppLayoutProps) => {
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
    const crumbs = [{ label: 'Home', href: '/' }];
    
    paths.forEach((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      crumbs.push({ label, href });
    });
    
    return crumbs;
  };

  const breadcrumbItems = breadcrumb || defaultBreadcrumb();

  return (
    <DepartmentGuard requiredAccess="main">
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Navbar */}
          <header className="sticky top-0 z-10 bg-white/70 backdrop-blur-xl backdrop-saturate-150 border-b border-gray-200/50 h-16 flex items-center justify-between px-3 sm:px-4 md:px-6">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm overflow-x-auto flex-shrink min-w-0">
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center flex-shrink-0">
                  {index > 0 && <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mx-1 sm:mx-2" />}
                  {item.href && index < breadcrumbItems.length - 1 ? (
                    <Link href={item.href} className="text-gray-600 hover:text-[#005357] transition-colors whitespace-nowrap">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={`${index === breadcrumbItems.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-600'} whitespace-nowrap`}>
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Side: Date/Time & Header Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 flex-shrink-0">
              {/* Today's Date & Time */}
              <div className="hidden md:flex items-center space-x-3 text-sm text-gray-600 border-r border-gray-300 pr-4 md:pr-6">
                <Calendar01Icon className="h-4 w-4 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium whitespace-nowrap">
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

              {/* Compact Date/Time for tablet */}
              <div className="flex md:hidden items-center space-x-2 text-xs text-gray-600 border-r border-gray-300 pr-3">
                <div className="flex flex-col items-end">
                  <span className="font-medium whitespace-nowrap">
                    {currentTime.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="text-gray-500" suppressHydrationWarning>
                    {currentTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              </div>

              {/* Header Actions */}
              <HeaderActions />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-50">
            <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-5 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DepartmentGuard>
  );
};

export default AppLayout;