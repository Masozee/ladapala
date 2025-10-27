'use client';

import { useState } from 'react';
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
  Home,
  UserIcon,
  Calendar01Icon,
  Shield01Icon,
  ChevronLeftIcon,
  PackageIcon
} from '@/lib/icons';

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

const OfficeSidebar = () => {
  const pathname = usePathname();

  const mainNavItems: MenuItem[] = [
    { name: 'Office Dashboard', icon: Building03Icon, href: '/office' },
    { name: 'Back to Main', icon: ChevronLeftIcon, href: '/' },
  ];

  const officeActions: MenuItem[] = [
    { name: 'Guest Database', icon: UserMultipleIcon, href: '/office/guests' },
    { name: 'Employees', icon: UserSettings01Icon, href: '/office/employees' },
    { name: 'Financial', icon: CreditCardIcon, href: '/office/financial' },
    { name: 'Warehouse', icon: PackageIcon, href: '/office/warehouse' },
    { name: 'Reports', icon: File01Icon, href: '/office/reports' },
    { name: 'Administration', icon: Shield01Icon, href: '/office/admin' },
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
      <div className="w-20 bg-white border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-[#005357] flex items-center justify-center p-1">
              <Image
                src="/logo.png"
                alt="Kapulaga Hotel Logo"
                width={32}
                height={32}
                className="object-contain invert"
              />
            </div>
          </div>
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
                          ? 'border border-gray-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110 ${
                        active ? 'bg-[#005357]' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          active ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
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

          <Separator.Root className="my-4 mx-2 bg-gray-200 h-px" />

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
                          ? ''
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110 ${
                        active ? 'bg-[#005357]' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          active ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
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
                          ? ''
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-110 ${
                        active ? 'bg-[#005357]' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          active ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
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