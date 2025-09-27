"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Building2,
  LogOut,
  Store,
  User,
  Utensils,
  Blocks,
  CreditCard
} from "lucide-react"
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
  icon: React.ComponentType<{ className?: string }>
}

const mainItems: SidebarItem[] = [
  {
    name: "Beranda",
    href: "/",
    icon: Home,
  },
  {
    name: "Menu",
    href: "/menu",
    icon: Utensils,
  },
  {
    name: "Meja",
    href: "/table",
    icon: Blocks,
  },
  {
    name: "Transaksi",
    href: "/transaction",
    icon: CreditCard,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-22 flex-col border-r bg-background">
        {/* Logo */}
        <div className="flex h-22 items-center justify-center border-b">
          <Store size={36} strokeWidth={2} />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex items-center justify-center p-4">
          <div className="space-y-2">
            {mainItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`w-full h-12 ${
                          isActive ? "bg-[#58ff34] text-black hover:bg-[#4de82a]" : "hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
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

        {/* Bottom Section - Profile & Settings */}
        <div className="border-t">
          {/* Profile */}
          <div className="p-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`w-full h-10 mt-2 ${
                      pathname === "/profile" ? "bg-[#58ff34] text-black hover:bg-[#4de82a]" : "hover:bg-gray-100"
                    }`}
                  >
                    <User size={30} strokeWidth={2} />
                    <span className="sr-only">Profil</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Profil</p>
              </TooltipContent>
            </Tooltip>

            {/* Office */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/office">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`w-full h-10 mt-2 ${
                      pathname.startsWith("/office") ? "bg-[#58ff34] text-black hover:bg-[#4de82a]" : "hover:bg-gray-100"
                    }`}
                  >
                    <Building2 size={30} strokeWidth={2} />
                    <span className="sr-only">Office</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Office</p>
              </TooltipContent>
            </Tooltip>

            {/* Logout */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-12 mt-2"
                  onClick={() => {
                    // Handle logout
                    console.log("Logout clicked")
                  }}
                >
                  <LogOut size={35} strokeWidth={2} />
                  <span className="sr-only">Keluar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Keluar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}