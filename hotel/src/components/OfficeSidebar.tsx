'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import * as Separator from '@radix-ui/react-separator';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Building2,
  Users,
  CreditCard,
  FileText,
  Settings,
  UserCog,
  Clock,
  TrendingUp,
  Home,
  User,
  BarChart3,
  Calendar,
  DollarSign,
  Shield,
  ArrowLeft,
  Package
} from 'lucide-react';

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

const OfficeSidebar = () => {
  const pathname = usePathname();

  const mainNavItems: MenuItem[] = [
    { name: 'Office Dashboard', icon: Building2, href: '/office' },
    { name: 'Back to Main', icon: ArrowLeft, href: '/' },
  ];

  const officeActions: MenuItem[] = [
    { name: 'Analytics', icon: BarChart3, href: '/office/analytics' },
    { name: 'Guest Database', icon: Users, href: '/guests' },
    { name: 'Employees', icon: UserCog, href: '/office/employees' },
    { name: 'Financial', icon: DollarSign, href: '/office/financial' },
    { name: 'Warehouse', icon: Package, href: '/office/warehouse' },
    { name: 'Schedules', icon: Calendar, href: '/office/schedules' },
    { name: 'Reports', icon: FileText, href: '/office/reports' },
    { name: 'Administration', icon: Shield, href: '/office/admin' },
  ];

  const bottomActions: MenuItem[] = [
    { name: 'Calendar', icon: Calendar, href: '/calendar' },
    { name: 'Office Settings', icon: Settings, href: '/office/settings' },
    { name: 'Profile', icon: User, href: '/profile' },
  ];

  const isActive = (href: string) => {
    if (href === '/office') return pathname === '/office';
    if (href === '/') return false; // Don't highlight main dashboard when in office
    return pathname.startsWith(href);
  };

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="w-20 bg-white shadow flex flex-col">
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
                          ? 'shadow-sm'
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

export default OfficeSidebar;