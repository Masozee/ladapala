'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import OfficeSidebar from './OfficeSidebar';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Search02Icon,
  Notification02Icon,
  Sun03Icon,
  Moon02Icon,
  Cancel01Icon,
  ChevronRightIcon,
  Logout01Icon,
  Calendar01Icon,
  Clock01Icon
} from '@/lib/icons';
import { buildApiUrl } from '@/lib/config';
import { useRouter } from 'next/navigation';

interface OfficeLayoutProps {
  children: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

interface HeaderContextType {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const useOfficeHeader = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useOfficeHeader must be used within OfficeLayout');
  }
  return context;
};

export const OfficeHeaderActions = () => {
  const { darkMode, setDarkMode, searchOpen, setSearchOpen, searchQuery, setSearchQuery, handleSearch } = useOfficeHeader();
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
      {/* Search Dialog */}
      <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
        <Dialog.Trigger asChild>
          <button className={`p-2 hover:bg-gray-100 transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600'}`}>
            <Search02Icon className="h-5 w-5" />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-[20%] left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 max-w-md w-full mx-4 p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Cari
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-gray-100 text-gray-500">
                  <Cancel01Icon className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <form onSubmit={handleSearch}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Cari karyawan, laporan, keuangan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#005357]"
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Batal
                    </button>
                  </Dialog.Close>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#005357] text-white hover:bg-[#004147] transition-colors"
                  >
                    Cari
                  </button>
                </div>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Notifications */}
      <button className={`relative p-2 hover:bg-gray-100 transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600'}`}>
        <Notification02Icon className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center">
          2
        </span>
      </button>

      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`p-2 hover:bg-gray-100 transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600'}`}
      >
        {darkMode ? <Sun03Icon className="h-5 w-5" /> : <Moon02Icon className="h-5 w-5" />}
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className={`p-2 hover:bg-gray-100 transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600'}`}
        title="Keluar"
      >
        <Logout01Icon className="h-5 w-5" />
      </button>
    </div>
  );
};

const OfficeLayout = ({ children, breadcrumb }: OfficeLayoutProps) => {
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const pathname = usePathname();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const contextValue = {
    darkMode,
    setDarkMode,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    handleSearch,
  };

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
    <HeaderContext.Provider value={contextValue}>
      <div className={`flex h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
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
    </HeaderContext.Provider>
  );
};

export default OfficeLayout;