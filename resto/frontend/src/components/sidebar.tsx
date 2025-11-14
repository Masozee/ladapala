"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  Building02Icon,
  Logout01Icon,
  LogoutCircle01Icon,
  LoginCircle01Icon,
  Store01Icon,
  UserIcon,
  MenuRestaurantIcon,
  CellsIcon,
  CreditCardIcon,
  Menu02Icon,
  ChefHatIcon,
  RestaurantIcon
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"

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
    name: "Dapur",
    href: "/kitchen",
    icon: ChefHatIcon,
  },
  {
    name: "Bar",
    href: "/bar",
    icon: RestaurantIcon,
  },
  {
    name: "Waitress",
    href: "/waitress",
    icon: UserIcon,
  },
  {
    name: "Transaksi",
    href: "/transaction",
    icon: CreditCardIcon,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, staff } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [hasActiveSession, setHasActiveSession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(false)

  // Check for active cashier session
  useEffect(() => {
    checkActiveSession()
  }, [staff])

  const checkActiveSession = async () => {
    if (!staff) {
      setHasActiveSession(false)
      return
    }

    try {
      setIsCheckingSession(true)
      const sessions = await api.getActiveCashierSession()
      setHasActiveSession(sessions.length > 0)
    } catch (error) {
      console.error('Error checking session:', error)
      setHasActiveSession(false)
    } finally {
      setIsCheckingSession(false)
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    setIsMenuOpen(false)

    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-22 min-w-[5.5rem] max-w-[5.5rem] flex-col bg-gray-50">
        {/* Logo */}
        <div className="flex h-22 min-h-[5.5rem] items-center justify-center">
          <HugeiconsIcon icon={Store01Icon} size={24} strokeWidth={2} className="text-gray-700 size-6 min-w-[1.5rem] min-h-[1.5rem]" />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex items-center justify-center p-4">
          <div className="space-y-2 w-full">
            {mainItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link href={item.href} className="block">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`w-full h-12 min-h-[3rem] rounded ${
                          isActive ? "bg-[#58ff34] text-black hover:bg-[#4de82a]" : "hover:bg-gray-100 text-gray-400"
                        }`}
                      >
                        <HugeiconsIcon icon={item.icon} size={24} strokeWidth={2} className="size-6 min-w-[1.5rem] min-h-[1.5rem]" />
                        <span className="sr-only">{item.name}</span>
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-gray-900 text-white px-3 py-1.5 text-sm rounded shadow-lg">
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
                className="w-full h-12 min-h-[3rem] rounded text-gray-400 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <HugeiconsIcon icon={Menu02Icon} size={24} strokeWidth={2} className="size-6 min-w-[1.5rem] min-h-[1.5rem]" />
                <span className="sr-only">Menu</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white px-3 py-1.5 text-sm rounded shadow-lg">
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
              <div className="absolute bottom-16 left-full ml-2 z-50 w-48 min-w-[12rem] bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 min-h-[2.5rem] hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <HugeiconsIcon icon={UserIcon} size={20} strokeWidth={2} className="text-gray-600 size-5 min-w-[1.25rem] min-h-[1.25rem] flex-shrink-0" />
                  <span className="text-sm text-gray-700">Profil</span>
                </Link>

                <Link
                  href="/office"
                  className="flex items-center gap-3 px-4 py-3 min-h-[2.5rem] hover:bg-gray-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <HugeiconsIcon icon={Building02Icon} size={20} strokeWidth={2} className="text-gray-600 size-5 min-w-[1.25rem] min-h-[1.25rem] flex-shrink-0" />
                  <span className="text-sm text-gray-700">Office</span>
                </Link>

                <div className="border-t border-gray-200 my-2" />

                {/* Cashier Session Management */}
                {staff && (
                  <>
                    {!hasActiveSession ? (
                      <Link
                        href="/session/open"
                        className="flex items-center gap-3 px-4 py-3 min-h-[2.5rem] hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <HugeiconsIcon icon={LoginCircle01Icon} size={20} strokeWidth={2} className="text-gray-600 size-5 min-w-[1.25rem] min-h-[1.25rem] flex-shrink-0" />
                        <span className="text-sm text-gray-700">Buka Kasir</span>
                      </Link>
                    ) : (
                      <Link
                        href="/shift-closing"
                        className="flex items-center gap-3 px-4 py-3 min-h-[2.5rem] hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <HugeiconsIcon icon={LogoutCircle01Icon} size={20} strokeWidth={2} className="text-gray-600 size-5 min-w-[1.25rem] min-h-[1.25rem] flex-shrink-0" />
                        <span className="text-sm text-gray-700">Tutup Kasir</span>
                      </Link>
                    )}
                  </>
                )}

                {/* Show session status indicator */}
                {staff && hasActiveSession && (
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 min-w-[0.5rem] min-h-[0.5rem] bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-gray-500">Sesi Aktif</span>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 my-2" />

                <button
                  className="flex items-center gap-3 px-4 py-3 min-h-[2.5rem] hover:bg-gray-50 transition-colors w-full text-left disabled:opacity-50"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <HugeiconsIcon icon={Logout01Icon} size={20} strokeWidth={2} className="text-red-600 size-5 min-w-[1.25rem] min-h-[1.25rem] flex-shrink-0" />
                  <span className="text-sm text-red-600">
                    {isLoggingOut ? 'Keluar...' : 'Keluar'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}