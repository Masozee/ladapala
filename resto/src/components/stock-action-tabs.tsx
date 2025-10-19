'use client'

import { useRouter, usePathname } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { Package01Icon, DeliveryTruck01Icon, DeliveryReturn01Icon, FileEditIcon, Analytics01Icon, Edit01Icon, ShoppingBasket01Icon } from '@hugeicons/core-free-icons'

export function StockActionTabs() {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = [
    {
      label: 'Dashboard Stok',
      icon: Package01Icon,
      path: '/office/stock',
    },
    {
      label: 'Master Item',
      icon: Edit01Icon,
      path: '/office/stock/items',
    },
    {
      label: 'Purchase Order',
      icon: ShoppingBasket01Icon,
      path: '/office/stock/purchase-orders',
    },
    {
      label: 'Penerimaan',
      icon: DeliveryTruck01Icon,
      path: '/office/stock/receipt',
    },
    {
      label: 'Transfer Stok',
      icon: DeliveryReturn01Icon,
      path: '/office/stock/transfer',
    },
    {
      label: 'Koreksi Stok',
      icon: FileEditIcon,
      path: '/office/stock/adjustment',
    },
    {
      label: 'Laporan',
      icon: Analytics01Icon,
      path: '/office/stock/reports',
    },
  ]

  const isActive = (tab: typeof tabs[0]) => {
    // Exact match for most paths
    if (pathname === tab.path) return true

    // For purchase-orders, also match detail pages
    if (tab.path === '/office/stock/purchase-orders' && pathname.startsWith('/office/stock/purchase-orders')) {
      return true
    }

    return false
  }

  return (
    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          onClick={() => router.push(tab.path)}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
            isActive(tab)
              ? 'bg-[#58ff34] text-black shadow-sm'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <HugeiconsIcon icon={tab.icon} size={16} strokeWidth={2} className="mr-2" />
          {tab.label}
        </button>
      ))}
    </div>
  )
}
