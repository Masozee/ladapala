'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { SparklesIcon, MessageAdd01Icon, Analytics01Icon, ArrowLeft01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, CustomerFeedback } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'

export default function FeedbackPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { staff } = useAuth()
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedback | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showCollect, setShowCollect] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Collection form state
  const [customerPhone, setCustomerPhone] = useState('')
  const [foodRating, setFoodRating] = useState(0)
  const [serviceRating, setServiceRating] = useState(0)
  const [ambianceRating, setAmbianceRating] = useState(0)
  const [valueRating, setValueRating] = useState(0)
  const [comments, setComments] = useState('')

  // Response state
  const [staffResponse, setStaffResponse] = useState('')

  useEffect(() => {
    fetchFeedbacks()
    fetchStats()
  }, [currentPage])

  const fetchFeedbacks = async () => {
    try {
      setLoading(true)
      const response = await api.getFeedbacks({
        page: currentPage,
        page_size: pageSize
      })
      setFeedbacks(response.results)
      setTotalCount(response.count)
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat data feedback',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await api.getFeedbackStats()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!customerPhone) {
      toast({
        title: 'Error',
        description: 'Nomor telepon pelanggan wajib diisi',
        variant: 'destructive',
      })
      return
    }

    if (foodRating === 0 || serviceRating === 0 || ambianceRating === 0 || valueRating === 0) {
      toast({
        title: 'Error',
        description: 'Semua kategori rating wajib diisi',
        variant: 'destructive',
      })
      return
    }

    try {
      // Lookup customer first
      const customer = await api.lookupCustomer(customerPhone)

      await api.createFeedback({
        customer: customer.id,
        food_rating: foodRating,
        service_rating: serviceRating,
        ambiance_rating: ambianceRating,
        value_rating: valueRating,
        comment: comments || undefined,
      })

      toast({
        title: 'Berhasil',
        description: 'Feedback berhasil disimpan',
      })

      // Reset form
      setCustomerPhone('')
      setFoodRating(0)
      setServiceRating(0)
      setAmbianceRating(0)
      setValueRating(0)
      setComments('')
      setShowCollect(false)

      fetchFeedbacks()
      fetchStats()
    } catch (error: any) {
      console.error('Error submitting feedback:', error)
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan feedback',
        variant: 'destructive',
      })
    }
  }

  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !staffResponse) return

    try {
      await api.respondToFeedback(selectedFeedback.id, staffResponse)

      toast({
        title: 'Berhasil',
        description: 'Respon berhasil dikirim',
      })

      setStaffResponse('')
      setShowDetail(false)
      fetchFeedbacks()
    } catch (error: any) {
      console.error('Error submitting response:', error)
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengirim respon',
        variant: 'destructive',
      })
    }
  }

  const renderStars = (rating: number, setRating?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating && setRating(star)}
            className={`${setRating ? 'cursor-pointer' : 'cursor-default'} transition-colors`}
            disabled={!setRating}
          >
            <HugeiconsIcon
              icon={SparklesIcon}
              size={24}
              strokeWidth={2}
              className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
            />
          </button>
        ))}
      </div>
    )
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 3.5) return 'text-yellow-600'
    if (rating >= 2.5) return 'text-orange-600'
    return 'text-red-600'
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
          <h1 className="text-3xl font-bold">Feedback Pelanggan</h1>
          <p className="text-muted-foreground">Kumpulkan dan kelola feedback dari pelanggan</p>
        </div>
        <Button onClick={() => setShowCollect(true)}>
          <HugeiconsIcon icon={MessageAdd01Icon} size={20} strokeWidth={2} className="mr-2" />
          Kumpulkan Feedback
        </Button>
      </div>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stats">
            <HugeiconsIcon icon={Analytics01Icon} size={16} strokeWidth={2} className="mr-2" />
            Statistik
          </TabsTrigger>
          <TabsTrigger value="list">
            <HugeiconsIcon icon={SparklesIcon} size={16} strokeWidth={2} className="mr-2" />
            Daftar Feedback
          </TabsTrigger>
        </TabsList>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Overall Rating */}
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>Rating Keseluruhan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-6xl font-bold">
                      <span className={getRatingColor(stats.overall_avg || 0)}>
                        {(stats.overall_avg || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex-1">
                      {renderStars(Math.round(stats.overall_avg || 0))}
                      <p className="text-sm text-gray-500 mt-2">
                        Dari {stats.total_feedbacks} feedback
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Food Rating */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kualitas Makanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-3xl font-bold ${getRatingColor(stats.food_avg || 0)}`}>
                      {(stats.food_avg || 0).toFixed(1)}
                    </span>
                    {renderStars(Math.round(stats.food_avg || 0))}
                  </div>
                </CardContent>
              </Card>

              {/* Service Rating */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kualitas Pelayanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-3xl font-bold ${getRatingColor(stats.service_avg || 0)}`}>
                      {(stats.service_avg || 0).toFixed(1)}
                    </span>
                    {renderStars(Math.round(stats.service_avg || 0))}
                  </div>
                </CardContent>
              </Card>

              {/* Ambiance Rating */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suasana</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-3xl font-bold ${getRatingColor(stats.ambiance_avg || 0)}`}>
                      {(stats.ambiance_avg || 0).toFixed(1)}
                    </span>
                    {renderStars(Math.round(stats.ambiance_avg || 0))}
                  </div>
                </CardContent>
              </Card>

              {/* Value Rating */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nilai & Harga</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-3xl font-bold ${getRatingColor(stats.value_avg || 0)}`}>
                      {(stats.value_avg || 0).toFixed(1)}
                    </span>
                    {renderStars(Math.round(stats.value_avg || 0))}
                  </div>
                </CardContent>
              </Card>

              {/* Response Rate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tingkat Respon</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.response_rate ? `${stats.response_rate}%` : '0%'}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {stats.responded_count || 0} dari {stats.total_feedbacks} feedback
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Feedback List Tab */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Semua Feedback</CardTitle>
              <CardDescription>Klik untuk melihat detail dan merespon feedback</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-gray-500 py-4">Memuat data...</p>
              ) : feedbacks.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Belum ada feedback</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Makanan</TableHead>
                        <TableHead>Pelayanan</TableHead>
                        <TableHead>Suasana</TableHead>
                        <TableHead>Nilai</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbacks.map((feedback) => (
                        <TableRow key={feedback.id}>
                          <TableCell>
                            {new Date(feedback.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {feedback.customer_name || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${getRatingColor(feedback.overall_rating)}`}>
                                {feedback.overall_rating.toFixed(1)}
                              </span>
                              <HugeiconsIcon
                                icon={SparklesIcon}
                                size={16}
                                strokeWidth={2}
                                className="text-yellow-400 fill-yellow-400"
                              />
                            </div>
                          </TableCell>
                          <TableCell>{feedback.food_rating}</TableCell>
                          <TableCell>{feedback.service_rating}</TableCell>
                          <TableCell>{feedback.ambiance_rating}</TableCell>
                          <TableCell>{feedback.value_rating}</TableCell>
                          <TableCell>
                            {feedback.staff_response ? (
                              <Badge className="bg-green-100 text-green-800">Direspon</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">Belum</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFeedback(feedback)
                                setShowDetail(true)
                              }}
                            >
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalCount > pageSize && (
                    <div className="flex items-center justify-between px-6 py-4 border-t mt-4">
                      <div className="text-sm text-gray-600">
                        Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} dari {totalCount} feedback
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Collection Sheet */}
      <Sheet open={showCollect} onOpenChange={setShowCollect}>
        <SheetContent className="w-1/2 overflow-y-auto p-0">
          <div className="sticky top-0 bg-white border-b p-6 z-10">
            <div className="flex items-center justify-between mb-2">
              <SheetTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={MessageAdd01Icon} size={24} strokeWidth={2} className="text-yellow-600" />
                Kumpulkan Feedback
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCollect(false)}
                className="h-8 w-8"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2} />
              </Button>
            </div>
            <SheetDescription>Minta pelanggan untuk memberikan rating pada setiap kategori</SheetDescription>
          </div>

          <div className="space-y-6 p-6">
            <div>
              <Label htmlFor="customer-phone">Nomor Telepon Pelanggan *</Label>
              <Input
                id="customer-phone"
                placeholder="081234567890"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div>
              <Label>Kualitas Makanan *</Label>
              <div className="mt-2">{renderStars(foodRating, setFoodRating)}</div>
            </div>

            <div>
              <Label>Kualitas Pelayanan *</Label>
              <div className="mt-2">{renderStars(serviceRating, setServiceRating)}</div>
            </div>

            <div>
              <Label>Suasana *</Label>
              <div className="mt-2">{renderStars(ambianceRating, setAmbianceRating)}</div>
            </div>

            <div>
              <Label>Nilai & Harga *</Label>
              <div className="mt-2">{renderStars(valueRating, setValueRating)}</div>
            </div>

            <div>
              <Label htmlFor="comments">Komentar (opsional)</Label>
              <Textarea
                id="comments"
                placeholder="Komentar atau saran tambahan..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>

            <Button onClick={handleSubmitFeedback} className="w-full">
              Simpan Feedback
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={showDetail} onOpenChange={setShowDetail}>
        <SheetContent className="w-7/12 overflow-y-auto p-0">
          <div className="sticky top-0 bg-white border-b p-6 z-10">
            <div className="flex items-center justify-between mb-2">
              <SheetTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={SparklesIcon} size={24} strokeWidth={2} className="text-yellow-600" />
                Detail Feedback
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetail(false)}
                className="h-8 w-8"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2} />
              </Button>
            </div>
            <SheetDescription>Informasi lengkap feedback dan respon staff</SheetDescription>
          </div>

          {selectedFeedback && (
            <div className="space-y-6 p-6">
              {/* Customer & Date */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Pelanggan</p>
                      <p className="font-medium">{selectedFeedback.customer_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tanggal</p>
                      <p className="font-medium">
                        {new Date(selectedFeedback.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ratings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rating</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Kualitas Makanan</span>
                      <span className="font-bold">{selectedFeedback.food_rating}</span>
                    </div>
                    {renderStars(selectedFeedback.food_rating)}
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Kualitas Pelayanan</span>
                      <span className="font-bold">{selectedFeedback.service_rating}</span>
                    </div>
                    {renderStars(selectedFeedback.service_rating)}
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Suasana</span>
                      <span className="font-bold">{selectedFeedback.ambiance_rating}</span>
                    </div>
                    {renderStars(selectedFeedback.ambiance_rating)}
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Nilai & Harga</span>
                      <span className="font-bold">{selectedFeedback.value_rating}</span>
                    </div>
                    {renderStars(selectedFeedback.value_rating)}
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Rating Keseluruhan</span>
                      <span className={`text-2xl font-bold ${getRatingColor(selectedFeedback.overall_rating)}`}>
                        {selectedFeedback.overall_rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              {selectedFeedback.comment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Komentar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedFeedback.comment}</p>
                  </CardContent>
                </Card>
              )}

              {/* Staff Response */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Respon Staff</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedFeedback.staff_response ? (
                    <div className="space-y-2">
                      <p className="text-gray-700">{selectedFeedback.staff_response}</p>
                      {selectedFeedback.responded_at && (
                        <p className="text-sm text-gray-500">
                          Direspon pada{' '}
                          {new Date(selectedFeedback.responded_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Tulis respon untuk pelanggan..."
                        value={staffResponse}
                        onChange={(e) => setStaffResponse(e.target.value)}
                        rows={4}
                      />
                      <Button onClick={handleSubmitResponse} disabled={!staffResponse}>
                        <HugeiconsIcon icon={MessageAdd01Icon} size={20} strokeWidth={2} className="mr-2" />
                        Kirim Respon
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
