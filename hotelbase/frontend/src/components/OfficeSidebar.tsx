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
  CalendarAdd01Icon,
  Shield01Icon,
  ChevronLeftIcon,
  PackageIcon,
  CircleArrowReload01Icon,
  PieChartIcon
} from '@/lib/icons';

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

const OfficeSidebar = () => {
  const pathname = usePathname();
  const [guestsCount, setGuestsCount] = useState<number>(0);
  const [employeesCount, setEmployeesCount] = useState<number>(0);
  const [occupancyCount, setOccupancyCount] = useState<number>(0);
  const [eventsCount, setEventsCount] = useState<number>(0);
  const [housekeepingCount, setHousekeepingCount] = useState<number>(0);
  const [financialCount, setFinancialCount] = useState<number>(0);
  const [warehouseCount, setWarehouseCount] = useState<number>(0);

  // Fetch sidebar counts
  useEffect(() => {
    const fetchSidebarCounts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hotel/sidebar-counts/`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setGuestsCount(data.office_sidebar?.new_guests || 0);
          setEmployeesCount(data.office_sidebar?.inactive_employees || 0);
          setOccupancyCount(data.office_sidebar?.checked_in_today || 0);
          setEventsCount(data.office_sidebar?.unconfirmed_events || 0);
          setHousekeepingCount(data.office_sidebar?.unfinished_housekeeping || 0);
          setFinancialCount(data.office_sidebar?.pending_financial || 0);
          setWarehouseCount(data.office_sidebar?.low_stock_items || 0);
        }
      } catch (error) {
        console.error('Error fetching sidebar counts:', error);
        setGuestsCount(0);
        setEmployeesCount(0);
        setOccupancyCount(0);
        setEventsCount(0);
        setHousekeepingCount(0);
        setFinancialCount(0);
        setWarehouseCount(0);
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
    { name: 'Guest Database', icon: UserMultipleIcon, href: '/office/guests', badge: guestsCount > 0 ? guestsCount.toString() : undefined },
    { name: 'Employees', icon: UserSettings01Icon, href: '/office/employees', badge: employeesCount > 0 ? employeesCount.toString() : undefined },
    { name: 'Occupancy', icon: PieChartIcon, href: '/office/occupancy', badge: occupancyCount > 0 ? occupancyCount.toString() : undefined },
    { name: 'Events', icon: CalendarAdd01Icon, href: '/office/events', badge: eventsCount > 0 ? eventsCount.toString() : undefined },
    { name: 'Housekeeping', icon: CircleArrowReload01Icon, href: '/office/housekeeping', badge: housekeepingCount > 0 ? housekeepingCount.toString() : undefined },
    { name: 'Financial', icon: CreditCardIcon, href: '/office/financial', badge: financialCount > 0 ? financialCount.toString() : undefined },
    { name: 'Warehouse', icon: PackageIcon, href: '/office/warehouse', badge: warehouseCount > 0 ? warehouseCount.toString() : undefined },
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
      <div className="w-20 bg-[#4E61D3] border border-[#4E61D3] flex flex-col h-screen">
        {/* Header */}
        <div className="flex-shrink-0 p-4">
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

        {/* Main Navigation - flex-1 to take remaining space */}
        <nav className="flex-1 flex flex-col py-2 min-h-0">
          <div className="flex-shrink-0 px-2 mb-2">
            {mainNavItems.map((item) => {
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

          <Separator.Root className="flex-shrink-0 my-2 mx-2 bg-white/20 h-px" />

          {/* Office Operations - at top, not centered */}
          <div className="flex-1 px-2 min-h-0">
            <div className="flex flex-col gap-0.5">
              {officeActions.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Tooltip.Root key={item.href}>
                    <Tooltip.Trigger asChild>
                      <Link
                        href={item.href}
                        className={`relative flex items-center justify-center w-16 h-11 transition-all duration-200 group ${
                          active
                            ? 'bg-white/10'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`h-5 w-5 text-white transition-transform group-hover:scale-110`} />
                        {item.badge && (
                          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center">
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
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="flex-shrink-0 p-2">
          <Separator.Root className="mb-2 mx-0 bg-white/20 h-px" />
          <div className="flex flex-col gap-0.5">
            {bottomActions.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Tooltip.Root key={item.href}>
                  <Tooltip.Trigger asChild>
                    <Link
                      href={item.href}
                      className={`relative flex items-center justify-center w-16 h-11 transition-all duration-200 group ${
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