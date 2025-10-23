'use client';

import { useState } from 'react';
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
  ChevronRightIcon
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

  const frontlineActions: MenuItem[] = [
    { name: 'Dashboard', icon: Home01Icon, href: '/' },
    { name: 'Bookings', icon: Calendar01Icon, href: '/bookings', badge: '12' },
    { name: 'Room Status', icon: BedIcon, href: '/rooms' },
    { name: 'Complaints', icon: QuestionIcon, href: '/complaints', badge: '5' },
    { name: 'Payments', icon: CreditCardIcon, href: '/payments' },
    { name: 'Reports', icon: File01Icon, href: '/reports' },
  ];

  const bottomActions: MenuItem[] = [
    { 
      name: 'Office', 
      icon: Building03Icon, 
      submenu: [
        { name: 'Office Dashboard', icon: Building03Icon, href: '/office' },
        { name: 'Analytics', icon: ArrowUp01Icon, href: '/office/analytics' },
        { name: 'Employees', icon: UserSettings01Icon, href: '/office/employees' },
        { name: 'Financial', icon: CreditCardIcon, href: '/office/financial' },
        { name: 'Warehouse', icon: PackageIcon, href: '/office/warehouse' },
        { name: 'Schedules', icon: Clock01Icon, href: '/office/schedules' },
        { name: 'Reports', icon: File01Icon, href: '/office/reports' },
        { name: 'Administration', icon: Shield01Icon, href: '/office/admin' },
      ]
    },
    { name: 'Calendar', icon: Calendar01Icon, href: '/calendar' },
    { name: 'Settings', icon: Settings02Icon, href: '/settings' },
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
      <div className="w-20 bg-[#005357] shadow flex flex-col">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-white flex items-center justify-center p-1">
              <Image
                src="/logo.png"
                alt="Kapulaga Hotel Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <Separator.Root className="mx-6 bg-white/20 h-px" />

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* Frontline Operations */}
          <div className="space-y-1 px-2">
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
                        className={`relative flex items-center justify-center w-16 h-12 transition-all duration-200 group ${
                          hasActiveSubmenu
                            ? 'bg-white/10'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`h-5 w-5 text-white transition-transform group-hover:scale-110`} />
                        {totalBadges > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center">
                            {totalBadges}
                          </span>
                        )}
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        side="right"
                        sideOffset={12}
                        className="bg-white shadow-lg border min-w-48 py-2 z-50"
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
                                className={`flex items-center px-3 py-2 text-sm transition-colors hover:bg-white/10 ${
                                  subActive ? 'bg-[#005357] text-white' : 'text-gray-700'
                                }`}
                              >
                                <SubIcon className={`h-4 w-4 mr-3 ${
                                  subActive ? 'text-white' : 'text-gray-500'
                                }`} />
                                <span className="flex-1">{subItem.name}</span>
                                {subItem.badge && (
                                  <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
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
                      className="bg-gray-900 text-white px-2 py-1 text-sm shadow-lg z-50"
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
                        className={`relative flex items-center justify-center w-16 h-12 transition-all duration-200 group ${
                          hasActiveSubmenu
                            ? 'bg-white/10'
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`h-5 w-5 text-white transition-transform group-hover:scale-110`} />
                        {totalBadges > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs flex items-center justify-center">
                            {totalBadges}
                          </span>
                        )}
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        side="right"
                        sideOffset={12}
                        className="bg-white shadow-lg border min-w-48 py-2 z-50"
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
                                className={`flex items-center px-3 py-2 text-sm transition-colors hover:bg-white/10 ${
                                  subActive ? 'bg-[#005357] text-white' : 'text-gray-700'
                                }`}
                              >
                                <SubIcon className={`h-4 w-4 mr-3 ${
                                  subActive ? 'text-white' : 'text-gray-500'
                                }`} />
                                <span className="flex-1">{subItem.name}</span>
                                {subItem.badge && (
                                  <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
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
                      className="bg-gray-900 text-white px-2 py-1 text-sm shadow-lg z-50"
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