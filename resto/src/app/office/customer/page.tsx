'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserMultiple02Icon, SparklesIcon, GiftIcon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

export default function CustomerPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeFeedbacks: 0,
    activeRewards: 0,
    averageRating: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Fetch customer stats
      const [customersResponse, feedbackStats, rewardsResponse] = await Promise.all([
        api.getCustomers({ is_active: true }),
        api.getFeedbackStats(),
        api.getRewards({ is_active: true })
      ])

      setStats({
        totalMembers: customersResponse.count || 0,
        activeFeedbacks: feedbackStats.total_feedbacks || 0,
        activeRewards: rewardsResponse.count || 0,
        averageRating: feedbackStats.overall_avg || 0
      })
    } catch (error) {
      console.error('Error fetching customer stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Memuat data...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">Sistem manajemen member, feedback, dan loyalitas pelanggan</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Member</CardTitle>
            <HugeiconsIcon icon={UserMultiple02Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Member aktif</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Rata-rata</CardTitle>
            <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Dari {stats.activeFeedbacks} feedback</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reward Aktif</CardTitle>
            <HugeiconsIcon icon={GiftIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRewards}</div>
            <p className="text-xs text-muted-foreground">Katalog reward tersedia</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeFeedbacks}</div>
            <p className="text-xs text-muted-foreground">Feedback diterima</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Sections */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Akses Cepat</h2>
          <p className="text-muted-foreground">Pilih modul untuk dikelola</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Membership Card */}
          <Card className="bg-white rounded-lg border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <HugeiconsIcon icon={UserMultiple02Icon} size={24} strokeWidth={2} className="text-blue-600" />
                </div>
              </div>
              <CardTitle className="mt-4">Membership</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Kelola data member, registrasi baru, dan tingkat keanggotaan
              </p>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full rounded"
                onClick={() => router.push('/office/customer/membership')}
              >
                Buka Membership
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Feedback Card */}
          <Card className="bg-white rounded-lg border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <HugeiconsIcon icon={SparklesIcon} size={24} strokeWidth={2} className="text-yellow-600" />
                </div>
              </div>
              <CardTitle className="mt-4">Feedback</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Kumpulkan feedback pelanggan, lihat statistik, dan berikan respon
              </p>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full rounded"
                onClick={() => router.push('/office/customer/feedback')}
              >
                Buka Feedback
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Loyalty & Rewards Card */}
          <Card className="bg-white rounded-lg border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <HugeiconsIcon icon={GiftIcon} size={24} strokeWidth={2} className="text-green-600" />
                </div>
              </div>
              <CardTitle className="mt-4">Loyalty & Rewards</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Kelola katalog reward, tier benefits, dan proses penukaran
              </p>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full rounded"
                onClick={() => router.push('/office/customer/loyalty')}
              >
                Buka Loyalty
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
