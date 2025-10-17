'use client';

import { OfficeSidebar } from "@/components/office-sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

export default function OfficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen">
        <OfficeSidebar />
        <div className="flex-1 flex flex-col bg-gray-50">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </AuthProvider>
  )
}