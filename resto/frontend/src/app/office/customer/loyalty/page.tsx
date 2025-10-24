'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { GiftIcon, Award01Icon, Add01Icon, CouponPercentIcon, Package01Icon, VoucherIcon, Ticket01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, Reward, MembershipTierBenefit } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function LoyaltyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [tierBenefits, setTierBenefits] = useState<MembershipTierBenefit[]>([])
  const [loading, setLoading] = useState(true)
  const [showRewardForm, setShowRewardForm] = useState(false)
  const [showTierForm, setShowTierForm] = useState(false)
  const [showRedemption, setShowRedemption] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Reward form state
  const [rewardName, setRewardName] = useState('')
  const [rewardType, setRewardType] = useState<'DISCOUNT' | 'FREE_ITEM' | 'VOUCHER'>('DISCOUNT')
  const [pointsCost, setPointsCost] = useState('')
  const [rewardValue, setRewardValue] = useState('')
  const [rewardDescription, setRewardDescription] = useState('')
  const [stockQuantity, setStockQuantity] = useState('')
  const [validDays, setValidDays] = useState('')

  // Tier form state
  const [tierName, setTierName] = useState<'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'>('BRONZE')
  const [minPoints, setMinPoints] = useState('')
  const [pointsMultiplier, setPointsMultiplier] = useState('')
  const [tierBenefitsText, setTierBenefitsText] = useState('')

  // Redemption state
  const [redemptionPhone, setRedemptionPhone] = useState('')
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)

  useEffect(() => {
    fetchRewards()
    fetchTierBenefits()
  }, [currentPage])

  const fetchRewards = async () => {
    try {
      setLoading(true)
      const response = await api.getRewards({
        page: currentPage,
        page_size: pageSize
      })
      setRewards(response.results)
      setTotalCount(response.count)
    } catch (error) {
      console.error('Error fetching rewards:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat data reward',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTierBenefits = async () => {
    try {
      const data = await api.getTierBenefits()
      setTierBenefits(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching tier benefits:', error)
      setTierBenefits([])
    }
  }

  const handleCreateReward = async () => {
    if (!rewardName || !pointsCost) {
      toast({
        title: 'Error',
        description: 'Nama reward dan poin yang diperlukan wajib diisi',
        variant: 'destructive',
      })
      return
    }

    try {
      await api.createReward({
        name: rewardName,
        reward_type: rewardType,
        points_required: parseInt(pointsCost),
        reward_value: rewardValue || undefined,
        description: rewardDescription || undefined,
        stock_quantity: stockQuantity ? parseInt(stockQuantity) : undefined,
        valid_days: validDays ? parseInt(validDays) : undefined,
      })

      toast({
        title: 'Berhasil',
        description: 'Reward baru berhasil dibuat',
      })

      // Reset form
      setRewardName('')
      setRewardType('DISCOUNT')
      setPointsCost('')
      setRewardValue('')
      setRewardDescription('')
      setStockQuantity('')
      setValidDays('')
      setShowRewardForm(false)

      fetchRewards()
    } catch (error: any) {
      console.error('Error creating reward:', error)
      toast({
        title: 'Error',
        description: error.message || 'Gagal membuat reward',
        variant: 'destructive',
      })
    }
  }

  const handleCreateTierBenefit = async () => {
    if (!minPoints || !pointsMultiplier) {
      toast({
        title: 'Error',
        description: 'Minimum poin dan multiplier wajib diisi',
        variant: 'destructive',
      })
      return
    }

    try {
      await api.createTierBenefit({
        tier: tierName,
        minimum_points: parseInt(minPoints),
        points_multiplier: parseFloat(pointsMultiplier),
        benefits: tierBenefitsText || undefined,
      })

      toast({
        title: 'Berhasil',
        description: 'Tier benefit berhasil dibuat',
      })

      setMinPoints('')
      setPointsMultiplier('')
      setTierBenefitsText('')
      setShowTierForm(false)

      fetchTierBenefits()
    } catch (error: any) {
      console.error('Error creating tier benefit:', error)
      toast({
        title: 'Error',
        description: error.message || 'Gagal membuat tier benefit',
        variant: 'destructive',
      })
    }
  }

  const handleRedeem = async () => {
    if (!redemptionPhone || !selectedReward) {
      toast({
        title: 'Error',
        description: 'Pilih reward dan masukkan nomor telepon pelanggan',
        variant: 'destructive',
      })
      return
    }

    try {
      const customer = await api.lookupCustomer(redemptionPhone)

      await api.redeemReward(customer.id, selectedReward.id)

      toast({
        title: 'Berhasil',
        description: `Reward "${selectedReward.name}" berhasil ditukar`,
      })

      setRedemptionPhone('')
      setSelectedReward(null)
      setShowRedemption(false)

      fetchRewards()
    } catch (error: any) {
      console.error('Error redeeming reward:', error)
      toast({
        title: 'Error',
        description: error.message || 'Gagal menukar reward',
        variant: 'destructive',
      })
    }
  }

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'DISCOUNT': return CouponPercentIcon
      case 'FREE_ITEM': return Package01Icon
      case 'VOUCHER': return VoucherIcon
      default: return GiftIcon
    }
  }

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'DISCOUNT': return 'Diskon'
      case 'FREE_ITEM': return 'Item Gratis'
      case 'VOUCHER': return 'Voucher'
      default: return type
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return 'bg-orange-100 text-orange-800'
      case 'SILVER': return 'bg-gray-100 text-gray-800'
      case 'GOLD': return 'bg-yellow-100 text-yellow-800'
      case 'PLATINUM': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/office/customer')}
        className="mb-2"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} className="mr-2" />
        Kembali
      </Button>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Loyalty & Rewards</h1>
          <p className="text-muted-foreground">Kelola katalog hadiah dan program loyalitas</p>
        </div>
      </div>

      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rewards">
            <HugeiconsIcon icon={GiftIcon} size={16} strokeWidth={2} className="mr-2" />
            Katalog Reward
          </TabsTrigger>
          <TabsTrigger value="tiers">
            <HugeiconsIcon icon={Award01Icon} size={16} strokeWidth={2} className="mr-2" />
            Tier Benefits
          </TabsTrigger>
          <TabsTrigger value="redeem">
            <HugeiconsIcon icon={Ticket01Icon} size={16} strokeWidth={2} className="mr-2" />
            Penukaran
          </TabsTrigger>
        </TabsList>

        {/* Rewards Tab */}
        <TabsContent value="rewards">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Katalog Reward</h2>
                <p className="text-muted-foreground">Daftar reward yang tersedia untuk ditukar</p>
              </div>
              <Button onClick={() => setShowRewardForm(true)}>
                <HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={2} className="mr-2" />
                Tambah Reward
              </Button>
            </div>

            {loading ? (
              <Card className="bg-white rounded-lg border">
                <CardContent className="py-12">
                  <div className="text-center">
                    <p className="text-muted-foreground">Memuat data...</p>
                  </div>
                </CardContent>
              </Card>
            ) : rewards.length === 0 ? (
              <Card className="bg-white rounded-lg border">
                <CardContent className="py-12">
                  <div className="text-center">
                    <p className="text-muted-foreground">Belum ada reward</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="rounded-lg border bg-white overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="font-semibold text-gray-900 py-4 px-6">Nama Reward</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-4 px-6">Tipe</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-4 px-6">Nilai</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Poin Dibutuhkan</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Stok</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Masa Berlaku</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rewards.map((reward) => (
                        <TableRow key={reward.id} className="hover:bg-gray-50 border-b">
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                <HugeiconsIcon
                                  icon={getRewardIcon(reward.reward_type)}
                                  size={16}
                                  strokeWidth={2}
                                  className="text-green-600"
                                />
                              </div>
                              <div>
                                <p className="font-medium">{reward.name}</p>
                                {reward.description && (
                                  <p className="text-sm text-muted-foreground">{reward.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <Badge>{getRewardTypeLabel(reward.reward_type)}</Badge>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            {reward.reward_value || '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600 py-4 px-6">
                            {reward.points_required.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-center py-4 px-6">
                            {reward.stock_quantity !== null ? (
                              <span className={reward.stock_quantity === 0 ? 'text-red-600 font-medium' : ''}>
                                {reward.stock_quantity === 0 ? 'Habis' : reward.stock_quantity}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Unlimited</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center py-4 px-6">
                            {reward.valid_days ? `${reward.valid_days} hari` : '-'}
                          </TableCell>
                          <TableCell className="text-center py-4 px-6">
                            {reward.is_active ? (
                              <Badge className="bg-green-500 text-white">Aktif</Badge>
                            ) : (
                              <Badge className="bg-gray-500 text-white">Tidak Aktif</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {!loading && totalCount > pageSize && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-gray-600">
                      Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} dari {totalCount} reward
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Sebelumnya
                      </Button>
                      <div className="text-sm text-gray-600">
                        Halaman {currentPage} dari {Math.ceil(totalCount / pageSize)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                        disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Tier Benefits Tab */}
        <TabsContent value="tiers">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowTierForm(true)}>
              <HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={2} className="mr-2" />
              Tambah Tier Benefit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tierBenefits.map((tier) => (
              <Card key={tier.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{tier.tier}</CardTitle>
                    <Badge className={getTierColor(tier.tier)}>{tier.tier}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Minimum Poin</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {tier.minimum_points.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Multiplier Poin</p>
                    <p className="text-xl font-bold text-green-600">{tier.points_multiplier}x</p>
                  </div>

                  {tier.benefits && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Benefits</p>
                      <p className="text-sm text-gray-700">{tier.benefits}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Redemption Tab */}
        <TabsContent value="redeem">
          <Card>
            <CardHeader>
              <CardTitle>Penukaran Reward</CardTitle>
              <CardDescription>Proses penukaran reward untuk pelanggan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="customer-phone">Nomor Telepon Pelanggan</Label>
                <Input
                  id="customer-phone"
                  placeholder="081234567890"
                  value={redemptionPhone}
                  onChange={(e) => setRedemptionPhone(e.target.value)}
                />
              </div>

              <div>
                <Label>Pilih Reward</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {rewards
                    .filter((r) => r.is_active && (r.stock_quantity === null || r.stock_quantity > 0))
                    .map((reward) => (
                      <Card
                        key={reward.id}
                        className={`cursor-pointer transition-all ${
                          selectedReward?.id === reward.id
                            ? 'ring-2 ring-green-500 bg-green-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedReward(reward)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3 mb-3">
                            <HugeiconsIcon
                              icon={getRewardIcon(reward.reward_type)}
                              size={24}
                              strokeWidth={2}
                              className="text-green-600"
                            />
                            <div>
                              <p className="font-medium">{reward.name}</p>
                              <p className="text-sm text-gray-500">{getRewardTypeLabel(reward.reward_type)}</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-green-600">
                            {reward.points_required.toLocaleString('id-ID')} poin
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              <Button
                onClick={handleRedeem}
                disabled={!redemptionPhone || !selectedReward}
                className="w-full"
              >
                Proses Penukaran
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reward Form Sheet */}
      <Sheet open={showRewardForm} onOpenChange={setShowRewardForm}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tambah Reward Baru</SheetTitle>
            <SheetDescription>Buat reward baru untuk program loyalitas</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6 pb-6">
            <div>
              <Label htmlFor="reward-name">Nama Reward *</Label>
              <Input
                id="reward-name"
                placeholder="Contoh: Diskon 10%"
                value={rewardName}
                onChange={(e) => setRewardName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="reward-type">Tipe Reward *</Label>
              <Select value={rewardType} onValueChange={(value) => setRewardType(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe reward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISCOUNT">Diskon</SelectItem>
                  <SelectItem value="FREE_ITEM">Item Gratis</SelectItem>
                  <SelectItem value="VOUCHER">Voucher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="points-cost">Poin yang Diperlukan *</Label>
              <Input
                id="points-cost"
                type="number"
                placeholder="100"
                value={pointsCost}
                onChange={(e) => setPointsCost(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="reward-value">Nilai Reward (opsional)</Label>
              <Input
                id="reward-value"
                placeholder="Contoh: 10% atau Rp 50.000"
                value={rewardValue}
                onChange={(e) => setRewardValue(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Deskripsi (opsional)</Label>
              <Textarea
                id="description"
                placeholder="Deskripsi reward..."
                value={rewardDescription}
                onChange={(e) => setRewardDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="stock">Stok (opsional, kosongkan jika unlimited)</Label>
              <Input
                id="stock"
                type="number"
                placeholder="100"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="valid-days">Masa Berlaku (hari, opsional)</Label>
              <Input
                id="valid-days"
                type="number"
                placeholder="30"
                value={validDays}
                onChange={(e) => setValidDays(e.target.value)}
              />
            </div>

            <Button onClick={handleCreateReward} className="w-full">
              Buat Reward
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Tier Benefit Form Sheet */}
      <Sheet open={showTierForm} onOpenChange={setShowTierForm}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tambah Tier Benefit</SheetTitle>
            <SheetDescription>Atur benefit untuk tier keanggotaan</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6 pb-6">
            <div>
              <Label htmlFor="tier-name">Tier *</Label>
              <Select value={tierName} onValueChange={(value) => setTierName(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRONZE">Bronze</SelectItem>
                  <SelectItem value="SILVER">Silver</SelectItem>
                  <SelectItem value="GOLD">Gold</SelectItem>
                  <SelectItem value="PLATINUM">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="min-points">Minimum Poin *</Label>
              <Input
                id="min-points"
                type="number"
                placeholder="0"
                value={minPoints}
                onChange={(e) => setMinPoints(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="multiplier">Multiplier Poin *</Label>
              <Input
                id="multiplier"
                type="number"
                step="0.1"
                placeholder="1.0"
                value={pointsMultiplier}
                onChange={(e) => setPointsMultiplier(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="tier-benefits">Benefits (opsional)</Label>
              <Textarea
                id="tier-benefits"
                placeholder="Daftar keuntungan untuk tier ini..."
                value={tierBenefitsText}
                onChange={(e) => setTierBenefitsText(e.target.value)}
                rows={4}
              />
            </div>

            <Button onClick={handleCreateTierBenefit} className="w-full">
              Buat Tier Benefit
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
