'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import * as Separator from '@radix-ui/react-separator';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Building03Icon,
  UserMultiple02Icon,
  HeadphonesIcon,
  HotelIcon,
  Calendar01Icon,
  CreditCardIcon,
  File01Icon,
  Settings02Icon,
  UserCheckIcon,
  BedIcon,
  Door01Icon,
  PackageIcon,
  UserSettings01Icon,
  Clock01Icon,
  ArrowUp01Icon,
  QuestionIcon,
  Wrench01Icon,
  Shield01Icon,
  Home01Icon,
  UserIcon,
  ChevronRightIcon,
  Archive03Icon
} from '@/lib/icons';

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string;
  submenu?: MenuItem[];
}

const Sidebar = () => {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [uncompletedComplaintsCount, setUncompletedComplaintsCount] = useState<number>(0);

  // Fetch all sidebar counts from centralized API
  useEffect(() => {
    const fetchSidebarCounts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hotel/sidebar-counts/`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setPendingCount(data.main_sidebar?.pending_bookings || 0);
          setUncompletedComplaintsCount(data.main_sidebar?.uncompleted_complaints || 0);
        }
      } catch (error) {
        console.error('Error fetching sidebar counts:', error);
        // Silently fail - don't break the sidebar
        setPendingCount(0);
        setUncompletedComplaintsCount(0);
      }
    };

    fetchSidebarCounts();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchSidebarCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const frontlineActions: MenuItem[] = [
    { name: 'Dashboard', icon: Home01Icon, href: '/' },
    { name: 'Bookings', icon: Calendar01Icon, href: '/bookings', badge: pendingCount > 0 ? pendingCount.toString() : undefined },
    { name: 'Room Status', icon: BedIcon, href: '/rooms' },
    { name: 'Complaints', icon: QuestionIcon, href: '/complaints', badge: uncompletedComplaintsCount > 0 ? uncompletedComplaintsCount.toString() : undefined },
    { name: 'Payments', icon: CreditCardIcon, href: '/payments' },
    { name: 'Wake Up Calls', icon: Clock01Icon, href: '/frontline/wake-up-calls' },
    { name: 'Lost & Found', icon: Archive03Icon, href: '/frontline/lost-and-found' },
  ];

  const bottomActions: MenuItem[] = [
    { name: 'Calendar', icon: Calendar01Icon, href: '/calendar' },
    { name: 'Profile', icon: UserIcon, href: '/profile' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isSubmenuActive = (submenu: MenuItem[]) => {
    return submenu.some(item => item.href && isActive(item.href));
  };

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="w-20 min-w-[5rem] max-w-[5rem] bg-[#005357] border border-gray-200 flex flex-col h-screen">
        {/* Header */}
        <div className="flex-shrink-0 p-4">
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] bg-white flex items-center justify-center p-1">
              <Image
                src="/logo.png"
                alt="Kapulaga Hotel Logo"
                width={32}
                height={32}
                className="object-contain w-full h-full"
                priority
              />
            </div>
          </div>
        </div>

        <Separator.Root className="flex-shrink-0 mx-4 bg-white/20 h-px" />

        {/* Main Navigation */}
        <nav className="flex-1 py-4 min-h-0">
          {/* Frontline Operations */}
          <div className="flex flex-col gap-0.5 px-2">
            {frontlineActions.map((item) => {
              const Icon = item.icon;

              // Handle submenu items (like Support)
              if (item.submenu) {
                const hasActiveSubmenu = isSubmenuActive(item.submenu);
                const totalBadges = item.submenu.reduce((sum, subItem) => {
                  const badgeNum = subItem.badge ? parseInt(subItem.badge) : 0;
                  return sum + badgeNum;
                }, 0);

                return (
                  <DropdownMenu.Root key={item.name}>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className={`relative flex items-center justify-center w-full h-12 min-h-[3rem] rounded transition-all duration-200 group ${
                          hasActiveSubmenu
                            ? 'bg-white/10'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`h-5 w-5 min-w-[1.25rem] min-h-[1.25rem] text-white transition-transform group-hover:scale-110`} />
                        {totalBadges > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 min-h-[1rem] min-w-[1rem] h-4 w-4 rounded-sm bg-red-500 text-white text-[0.625rem] leading-none flex items-center justify-center">
                            {totalBadges}
                          </span>
                        )}
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        side="right"
                        sideOffset={12}
                        className="bg-white border border-gray-300 min-w-[12rem] py-2 z-50 shadow-lg"
                      >
                        <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-100">
                          {item.name}
                        </div>
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const subActive = subItem.href ? isActive(subItem.href) : false;

                          return (
                            <DropdownMenu.Item key={subItem.name} asChild>
                              <Link
                                href={subItem.href || '#'}
                                className={`flex items-center px-3 py-2 min-h-[2.5rem] text-sm transition-colors hover:bg-gray-50 ${
                                  subActive ? 'bg-[#005357] text-white' : 'text-gray-700'
                                }`}
                              >
                                <SubIcon className={`h-4 w-4 min-w-[1rem] min-h-[1rem] mr-3 flex-shrink-0 ${
                                  subActive ? 'text-white' : 'text-gray-500'
                                }`} />
                                <span className="flex-1">{subItem.name}</span>
                                {subItem.badge && (
                                  <span className={`ml-2 px-1.5 py-0.5 text-[0.625rem] leading-none rounded ${
                                    subActive ? 'bg-white text-[#005357]' : 'bg-red-100 text-red-600'
                                  }`}>
                                    {subItem.badge}
                                  </span>
                                )}
                              </Link>
                            </DropdownMenu.Item>
                          );
                        })}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                );
              }

              // Handle regular menu items
              const active = item.href ? isActive(item.href) : false;

              return (
                <Tooltip.Root key={item.href || item.name}>
                  <Tooltip.Trigger asChild>
                    <Link
                      href={item.href || '#'}
                      className={`relative flex items-center justify-center w-full h-11 transition-all duration-200 group ${
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
                      className="bg-gray-900 text-white px-3 py-1.5 text-sm rounded shadow-lg z-50"
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
        <div className="flex-shrink-0 p-2">
          <Separator.Root className="mb-2 mx-0 bg-white/20 h-px" />
          <div className="flex flex-col gap-0.5">
            {bottomActions.map((item) => {
              const Icon = item.icon;

              // Handle submenu items (like Support)
              if (item.submenu) {
                const hasActiveSubmenu = isSubmenuActive(item.submenu);
                const totalBadges = item.submenu.reduce((sum, subItem) => {
                  const badgeNum = subItem.badge ? parseInt(subItem.badge) : 0;
                  return sum + badgeNum;
                }, 0);

                return (
                  <DropdownMenu.Root key={item.name}>
                    <DropdownMenu.Trigger asChild>
                      <button
                        className={`relative flex items-center justify-center w-full h-12 min-h-[3rem] rounded transition-all duration-200 group ${
                          hasActiveSubmenu
                            ? 'bg-white/10'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`h-5 w-5 min-w-[1.25rem] min-h-[1.25rem] text-white transition-transform group-hover:scale-110`} />
                        {totalBadges > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 min-h-[1rem] min-w-[1rem] h-4 w-4 rounded-sm bg-red-500 text-white text-[0.625rem] leading-none flex items-center justify-center">
                            {totalBadges}
                          </span>
                        )}
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        side="right"
                        sideOffset={12}
                        className="bg-white border border-gray-300 min-w-[12rem] py-2 z-50 shadow-lg"
                      >
                        <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-100">
                          {item.name}
                        </div>
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const subActive = subItem.href ? isActive(subItem.href) : false;

                          return (
                            <DropdownMenu.Item key={subItem.name} asChild>
                              <Link
                                href={subItem.href || '#'}
                                className={`flex items-center px-3 py-2 min-h-[2.5rem] text-sm transition-colors hover:bg-gray-50 ${
                                  subActive ? 'bg-[#005357] text-white' : 'text-gray-700'
                                }`}
                              >
                                <SubIcon className={`h-4 w-4 min-w-[1rem] min-h-[1rem] mr-3 flex-shrink-0 ${
                                  subActive ? 'text-white' : 'text-gray-500'
                                }`} />
                                <span className="flex-1">{subItem.name}</span>
                                {subItem.badge && (
                                  <span className={`ml-2 px-1.5 py-0.5 text-[0.625rem] leading-none rounded ${
                                    subActive ? 'bg-white text-[#005357]' : 'bg-red-100 text-red-600'
                                  }`}>
                                    {subItem.badge}
                                  </span>
                                )}
                              </Link>
                            </DropdownMenu.Item>
                          );
                        })}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                );
              }

              // Handle regular menu items
              const active = item.href ? isActive(item.href) : false;

              return (
                <Tooltip.Root key={item.href || item.name}>
                  <Tooltip.Trigger asChild>
                    <Link
                      href={item.href || '#'}
                      className={`relative flex items-center justify-center w-full h-11 transition-all duration-200 group ${
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
                      className="bg-gray-900 text-white px-3 py-1.5 text-sm rounded shadow-lg z-50"
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

export default Sidebar;