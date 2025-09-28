'use client';

import { useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import SupportSidebar from './SupportSidebar';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, Bell, Sun, Moon, X, ChevronRight } from 'lucide-react';

interface SupportLayoutProps {
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

export const useSupportHeader = () => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useSupportHeader must be used within SupportLayout');
  }
  return context;
};

export const SupportHeaderActions = () => {
  const { darkMode, setDarkMode, searchOpen, setSearchOpen, searchQuery, setSearchQuery, handleSearch } = useSupportHeader();

  return (
    <div className="flex items-center space-x-4">
      {/* Search Dialog */}
      <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
        <Dialog.Trigger asChild>
          <button className={`p-2 hover:bg-gray-100 transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600'}`}>
            <Search className="h-5 w-5" />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-[20%] left-1/2 transform -translate-x-1/2 bg-white shadow-lg max-w-md w-full mx-4 p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Cari
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1 hover:bg-gray-100 text-gray-500">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <form onSubmit={handleSearch}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Cari maintenance, housekeeping, amenities..."
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
        <Bell className="h-5 w-5" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center">
          5
        </span>
      </button>

      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`p-2 hover:bg-gray-100 transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600'}`}
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </div>
  );
};

const SupportLayout = ({ children, breadcrumb }: SupportLayoutProps) => {
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

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
    const crumbs = [{ label: 'Support', href: '/support' }];
    
    // Skip the first 'support' segment since we already have it as root
    paths.slice(1).forEach((path, index) => {
      const href = '/support/' + paths.slice(1, index + 2).join('/');
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      crumbs.push({ label, href });
    });
    
    return crumbs;
  };

  const breadcrumbItems = breadcrumb || defaultBreadcrumb();

  return (
    <HeaderContext.Provider value={contextValue}>
      <div className={`flex h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <SupportSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navbar */}
          <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm">
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />}
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

            {/* Header Actions */}
            <SupportHeaderActions />
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </HeaderContext.Provider>
  );
};

export default SupportLayout;