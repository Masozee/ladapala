'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import * as Separator from '@radix-ui/react-separator';
import * as Tooltip from '@radix-ui/react-tooltip';
import { buildApiUrl } from '@/lib/config';
import {
  Wrench01Icon,
  CircleArrowReload01Icon,
  PackageIcon,
  Settings02Icon,
  UserIcon,
  HeadphonesIcon,
  File01Icon,
  Calendar01Icon
} from '@/lib/icons';

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string | number;
}

const SupportSidebar = () => {
  const pathname = usePathname();
  const [maintenanceCount, setMaintenanceCount] = useState<number>(0);
  const [housekeepingCount, setHousekeepingCount] = useState<number>(0);
  const [amenitiesCount, setAmenitiesCount] = useState<number>(0);

  useEffect(() => {
    // Fetch all sidebar counts from centralized API
    const fetchSidebarCounts = async () => {
      try {
        const response = await fetch(
          buildApiUrl('hotel/sidebar-counts/'),
          {
            credentials: 'include',
          }
        );
        if (response.ok) {
          const data = await response.json();
          setMaintenanceCount(data.support_sidebar?.active_maintenance || 0);
          setHousekeepingCount(data.support_sidebar?.unfinished_housekeeping || 0);
          setAmenitiesCount(data.support_sidebar?.unfinished_amenities || 0);
        } else {
          console.error('Failed to fetch sidebar counts:', response.status);
        }
      } catch (error) {
        console.error('Error fetching sidebar counts:', error);
        setMaintenanceCount(0);
        setHousekeepingCount(0);
        setAmenitiesCount(0);
      }
    };

    fetchSidebarCounts();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchSidebarCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const mainNavItems: MenuItem[] = [
    { name: 'Support Dashboard', icon: HeadphonesIcon, href: '/support' },
  ];

  const supportActions: MenuItem[] = [
    { name: 'Maintenance', icon: Wrench01Icon, href: '/support/maintenance', badge: maintenanceCount > 0 ? maintenanceCount : undefined },
    { name: 'Housekeeping', icon: CircleArrowReload01Icon, href: '/support/housekeeping', badge: housekeepingCount > 0 ? housekeepingCount : undefined },
    { name: 'Amenities Request', icon: PackageIcon, href: '/support/amenities', badge: amenitiesCount > 0 ? amenitiesCount : undefined },
    { name: 'Reports', icon: File01Icon, href: '/support/reports' },
  ];

  const bottomActions: MenuItem[] = [
    { name: 'Calendar', icon: Calendar01Icon, href: '/calendar' },
    { name: 'Profile', icon: UserIcon, href: '/profile' },
  ];

  const isActive = (href: string) => {
    if (href === '/support') return pathname === '/support';
    if (href === '/') return false;
    return pathname.startsWith(href);
  };

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="w-20 bg-[#F87B1B] flex flex-col h-screen">
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

        {/* Main Navigation */}
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

          {/* Support Operations */}
          <div className="flex-1 px-2 min-h-0">
            <div className="flex flex-col gap-0.5">
              {supportActions.map((item) => {
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

export default SupportSidebar;