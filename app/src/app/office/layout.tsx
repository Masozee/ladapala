import { OfficeSidebar } from "@/components/office-sidebar"
import { TopNavbar } from "@/components/top-navbar"

export default function OfficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <OfficeSidebar />
      <div className="flex-1 flex flex-col">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}