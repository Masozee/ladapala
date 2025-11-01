'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import * as Separator from '@radix-ui/react-separator';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Building03Icon,
  UserMultipleIcon,
  CreditCardIcon,
  File01Icon,
  Settings02Icon,
  UserSettings01Icon,
  Clock01Icon,
  ArrowUp01Icon,
  Home01Icon,
  UserIcon,
  Calendar01Icon,
  Shield01Icon,
  ChevronLeftIcon,
  PackageIcon,
  CircleArrowReload01Icon,
  Archive03Icon
} from '@/lib/icons';

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

const OfficeSidebar = () => {
  const pathname = usePathname();
  const [housekeepingCount, setHousekeepingCount] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  // Fetch sidebar counts
  useEffect(() => {
    const fetchSidebarCounts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hotel/sidebar-counts/`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setHousekeepingCount(data.office_sidebar?.unfinished_housekeeping || 0);
          setLowStockCount(data.office_sidebar?.low_stock_items || 0);
        }
      } catch (error) {
        console.error('Error fetching sidebar counts:', error);
        setHousekeepingCount(0);
        setLowStockCount(0);
      }
    };

    fetchSidebarCounts();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchSidebarCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const mainNavItems: MenuItem[] = [
    { name: 'Office Dashboard', icon: Building03Icon, href: '/office' },
  ];

  const officeActions: MenuItem[] = [
    { name: 'Guest Database', icon: UserMultipleIcon, href: '/office/guests' },
    { name: 'Employees', icon: UserSettings01Icon, href: '/office/employees' },
    { name: 'Housekeeping', icon: CircleArrowReload01Icon, href: '/office/housekeeping', badge: housekeepingCount > 0 ? housekeepingCount.toString() : undefined },
    { name: 'Financial', icon: CreditCardIcon, href: '/office/financial' },
    { name: 'Warehouse', icon: PackageIcon, href: '/office/warehouse', badge: lowStockCount > 0 ? lowStockCount.toString() : undefined },
    { name: 'Suppliers', icon: Archive03Icon, href: '/office/suppliers' },
    { name: 'Reports', icon: File01Icon, href: '/office/reports' },
  ];

  const bottomActions: MenuItem[] = [
    { name: 'Calendar', icon: Calendar01Icon, href: '/calendar' },
    { name: 'Office Settings', icon: Settings02Icon, href: '/office/settings' },
    { name: 'Profile', icon: UserIcon, href: '/profile' },
  ];

  const isActive = (href: string) => {
    if (href === '/office') return pathname === '/office';
    if (href === '/') return false; // Don't highlight main dashboard when in office
    return pathname.startsWith(href);
  };

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="w-20 bg-[#4E61D3] border border-[#4E61D3] flex flex-col">
        {/* Header */}
        <div className="p-4">
          <Link href="/" className="flex items-center justify-center group">
            <div className="w-10 h-10 bg-white flex items-center justify-center p-1 transition-transform group-hover:scale-110">
              <Image
                src="/logo.png"
                alt="Kapulaga Hotel Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-2 px-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Tooltip.Root key={item.href}>
                  <Tooltip.Trigger asChild>
                    <Link
                      href={item.href}
                      className={`relative flex items-center justify-center w-16 h-14 transition-all duration-200 group ${
                        active
                          ? 'bg-white/10'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`h-6 w-6 text-white transition-transform group-hover:scale-110`} />
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      sideOffset={12}
                      className="bg-gray-900 text-white px-2 py-1 text-sm border border-gray-300 z-50"
                    >
                      {item.name}
                      <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            })}
          </div>

          <Separator.Root className="my-4 mx-2 bg-white/20 h-px" />

          {/* Office Operations */}
          <div className="space-y-1 px-2">
            {officeActions.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Tooltip.Root key={item.href}>
                  <Tooltip.Trigger asChild>
                    <Link
                      href={item.href}
                      className={`relative flex items-center justify-center w-16 h-12 transition-all duration-200 group ${
                        active
                          ? 'bg-white/10'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`h-5 w-5 text-white transition-transform group-hover:scale-110`} />
                      {item.badge && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      sideOffset={12}
                      className="bg-gray-900 text-white px-2 py-1 text-sm border border-gray-300 z-50"
                    >
                      {item.name}
                      <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-2">
          <Separator.Root className="mb-4 mx-0 bg-white/20 h-px" />
          <div className="space-y-1">
            {bottomActions.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Tooltip.Root key={item.href}>
                  <Tooltip.Trigger asChild>
                    <Link
                      href={item.href}
                      className={`relative flex items-center justify-center w-16 h-12 transition-all duration-200 group ${
                        active
                          ? 'bg-white/10'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`h-5 w-5 text-white transition-transform group-hover:scale-110`} />
                    </Link>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      sideOffset={12}
                      className="bg-gray-900 text-white px-2 py-1 text-sm border border-gray-300 z-50"
                    >
                      {item.name}
                      <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            })}
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
};

export default OfficeSidebar;