"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Package,
  Calendar,
  BookOpen,
  FileBarChart,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface OfficeSidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const officeItems: OfficeSidebarItem[] = [
  {
    name: "Stok",
    href: "/office/stock",
    icon: Package,
  },
  {
    name: "Jadwal",
    href: "/office/schedule",
    icon: Calendar,
  },
  {
    name: "Resep",
    href: "/office/recipe",
    icon: BookOpen,
  },
  {
    name: "Laporan",
    href: "/office/report",
    icon: FileBarChart,
  },
]

export function OfficeSidebar() {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-64 flex-col border-r bg-background">
        {/* Header with Back Button */}
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <h2 className="text-lg font-semibold">Office</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Kembali ke Dashboard</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Kembali ke Dashboard</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {officeItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  )
}