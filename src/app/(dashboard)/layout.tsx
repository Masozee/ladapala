import { Sidebar } from "@/components/sidebar"
import { TopNavbar } from "@/components/top-navbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col bg-gray-50">
        <TopNavbar />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}