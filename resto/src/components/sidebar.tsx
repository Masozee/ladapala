"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  Building02Icon,
  Logout01Icon,
  Store01Icon,
  UserIcon,
  MenuRestaurantIcon,
  CellsIcon,
  CreditCardIcon,
  Menu02Icon
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarItem {
  name: string
  href: string
  icon: typeof Home01Icon
}

const mainItems: SidebarItem[] = [
  {
    name: "Beranda",
    href: "/",
    icon: Home01Icon,
  },
  {
    name: "Menu",
    href: "/menu",
    icon: MenuRestaurantIcon,
  },
  {
    name: "Meja",
    href: "/table",
    icon: CellsIcon,
  },
  {
    name: "Transaksi",
    href: "/transaction",
    icon: CreditCardIcon,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-22 flex-col bg-gray-50">
        {/* Logo */}
        <div className="flex h-22 items-center justify-center">
          <HugeiconsIcon icon={Store01Icon} size={24} strokeWidth={2} className="text-gray-700 size-6" />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex items-center justify-center p-4">
          <div className="space-y-2">
            {mainItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`w-full h-12 ${
                          isActive ? "bg-[#58ff34] text-black hover:bg-[#4de82a]" : "hover:bg-gray-100 text-gray-400"
                        }`}
                      >
                        <HugeiconsIcon icon={item.icon} size={24} strokeWidth={2} className="size-6" />
                        <span className="sr-only">{item.name}</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </nav>

        {/* Bottom Section - Menu Button */}
        <div className="p-4 relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-12 text-gray-400 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <HugeiconsIcon icon={Menu02Icon} size={24} strokeWidth={2} className="size-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Menu</p>
            </TooltipContent>
          </Tooltip>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />

              {/* Menu Content */}
              <div className="absolute bottom-16 left-full ml-2 z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <HugeiconsIcon icon={UserIcon} size={20} strokeWidth={2} className="text-gray-600 size-5" />
                  <span className="text-sm text-gray-700">Profil</span>
                </Link>

                <Link
                  href="/office"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <HugeiconsIcon icon={Building02Icon} size={20} strokeWidth={2} className="text-gray-600 size-5" />
                  <span className="text-sm text-gray-700">Office</span>
                </Link>

                <div className="border-t border-gray-200 my-2" />

                <button
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors w-full text-left"
                  onClick={() => {
                    setIsMenuOpen(false)
                    console.log("Logout clicked")
                  }}
                >
                  <HugeiconsIcon icon={Logout01Icon} size={20} strokeWidth={2} className="text-red-600 size-5" />
                  <span className="text-sm text-red-600">Keluar</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}