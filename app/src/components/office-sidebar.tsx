"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Package,
  CalendarRange,
  BookMarked,
  FileBarChart,
  Settings,
  Store,
  LogOut,
  User,
  ArrowLeft
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

const officeItems: SidebarItem[] = [
  {
    name: "Stok",
    href: "/office/stock",
    icon: Package,
  },
  {
    name: "Jadwal",
    href: "/office/schedule",
    icon: CalendarRange,
  },
  {
    name: "Resep",
    href: "/office/recipe",
    icon: BookMarked,
  },
  {
    name: "Laporan",
    href: "/office/report",
    icon: FileBarChart,
  },
  {
    name: "Pengaturan",
    href: "/office/settings",
    icon: Settings,
  },
]

export function OfficeSidebar() {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-22 flex-col border-r bg-background">
        {/* Logo */}
        <div className="flex h-22 items-center justify-center border-b">
          <Store size={36} strokeWidth={2} />
        </div>

        {/* Back to Dashboard Button */}
        <div className="p-4 border-b">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-12 bg-gray-100 hover:bg-gray-200"
                >
                  <ArrowLeft className="h-6 w-6" />
                  <span className="sr-only">Kembali ke Dashboard</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Kembali ke Dashboard</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Office Navigation */}
        <nav className="flex-1 flex items-center justify-center p-4">
          <div className="space-y-2">
            {officeItems.map((item) => {
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

        {/* Bottom Section - Profile & Logout */}
        <div className="border-t">
          <div className="p-4">
            {/* Profile */}
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