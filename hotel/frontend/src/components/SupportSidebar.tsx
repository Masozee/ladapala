'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import * as Separator from '@radix-ui/react-separator';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Wrench01Icon,
  BedIcon,
  PackageIcon,
  Mail01Icon,
  UserCheckIcon,
  AlertCircleIcon,
  Clock01Icon,
  Settings02Icon,
  UserIcon,
  ChevronLeftIcon,
  HeadphonesIcon,
  Notification02Icon,
  File01Icon,
  Calendar01Icon
} from '@/lib/icons';

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

const SupportSidebar = () => {
  const pathname = usePathname();

  const mainNavItems: MenuItem[] = [
    { name: 'Support Dashboard', icon: HeadphonesIcon, href: '/support' },
    { name: 'Main Dashboard', icon: ChevronLeftIcon, href: '/' },
  ];

  const supportActions: MenuItem[] = [
    { name: 'Maintenance', icon: Wrench01Icon, href: '/support/maintenance', badge: '3' },
    { name: 'Housekeeping', icon: BedIcon, href: '/support/housekeeping', badge: '7' },
    { name: 'Amenities Request', icon: PackageIcon, href: '/support/amenities', badge: '2' },
    { name: 'Work Orders', icon: UserCheckIcon, href: '/support/workorders' },
    { name: 'Emergency', icon: AlertCircleIcon, href: '/support/emergency' },
    { name: 'Reports', icon: File01Icon, href: '/support/reports' },
  ];

  const bottomActions: MenuItem[] = [
    { name: 'Calendar', icon: Calendar01Icon, href: '/calendar' },
    { name: 'Support Settings', icon: Settings02Icon, href: '/support/settings' },
    { name: 'Profile', icon: UserIcon, href: '/profile' },
  ];

  const isActive = (href: string) => {
    if (href === '/support') return pathname === '/support';
    if (href === '/') return false;
    return pathname.startsWith(href);
  };

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="w-20 bg-[#F87B1B] flex flex-col">
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

          {/* Support Operations */}
          <div className="space-y-1 px-2">
            {supportActions.map((item) => {
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

export default SupportSidebar;