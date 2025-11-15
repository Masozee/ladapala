'use client';

import { Sidebar } from "@/components/sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col bg-gray-50">
          <TopNavbar />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </AuthProvider>
  )
}