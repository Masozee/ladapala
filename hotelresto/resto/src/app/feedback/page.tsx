'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { SparklesIcon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'

export default function PublicFeedbackPage() {
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    foodRating: 0,
    serviceRating: 0,
    ambianceRating: 0,
    valueRating: 0,
    comment: '',
    liked: '',
    disliked: '',
    suggestions: '',
    wouldRecommend: true,
  })

  const handleRatingClick = (category: string, rating: number) => {
    setFormData({ ...formData, [category]: rating })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.foodRating === 0 || formData.serviceRating === 0 ||
        formData.ambianceRating === 0 || formData.valueRating === 0) {
      alert('Mohon berikan rating untuk semua kategori')
      return
    }

    try {
      setLoading(true)
      await api.createFeedback({
        food_rating: formData.foodRating,
        service_rating: formData.serviceRating,
        ambiance_rating: formData.ambianceRating,
        value_rating: formData.valueRating,
        comment: formData.comment || undefined,
        liked: formData.liked || undefined,
        disliked: formData.disliked || undefined,
        suggestions: formData.suggestions || undefined,
        would_recommend: formData.wouldRecommend,
        contact_name: formData.contactName || undefined,
        contact_phone: formData.contactPhone || undefined,
        contact_email: formData.contactEmail || undefined,
      })

      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Gagal mengirim feedback. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#58ff34]/10 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-[#58ff34]/20 p-3">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-12 w-12 text-[#58ff34]" strokeWidth={2} />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Terima Kasih!</h2>
            <p className="text-muted-foreground mb-6">
              Feedback Anda sangat berharga bagi kami untuk terus meningkatkan kualitas layanan.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false)
                setFormData({
                  contactName: '',
                  contactPhone: '',
                  contactEmail: '',
                  foodRating: 0,
                  serviceRating: 0,
                  ambianceRating: 0,
                  valueRating: 0,
                  comment: '',
                  liked: '',
                  disliked: '',
                  suggestions: '',
                  wouldRecommend: true,
                })
              }}
              className="bg-[#58ff34] hover:bg-[#4de82a] text-black"
            >
              Kirim Feedback Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#58ff34]/10 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-[#58ff34]/20 p-3">
              <HugeiconsIcon icon={SparklesIcon} className="h-12 w-12 text-[#58ff34]" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Feedback Pelanggan</h1>
          <p className="text-muted-foreground">
            Bagikan pengalaman Anda untuk membantu kami memberikan layanan terbaik
          </p>
        </div>

        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle>Berikan Penilaian Anda</CardTitle>
            <CardDescription>
              Semua rating wajib diisi. Informasi kontak bersifat opsional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating Categories */}
              <div className="space-y-6">
                {/* Food Rating */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Kualitas Makanan <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">Rasa, kesegaran, presentasi, dan porsi makanan</p>
                  <p className="text-xs text-gray-500 italic">1 bintang = buruk, 5 bintang = sangat baik</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick('foodRating', star)}
                        className={`text-3xl transition-colors ${
                          star <= formData.foodRating
                            ? 'text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {formData.foodRating > 0 && (
                    <p className="text-sm text-center font-medium text-[#58ff34]">
                      {formData.foodRating === 1 && 'Buruk Sekali'}
                      {formData.foodRating === 2 && 'Kurang Baik'}
                      {formData.foodRating === 3 && 'Cukup'}
                      {formData.foodRating === 4 && 'Baik'}
                      {formData.foodRating === 5 && 'Sangat Baik'}
                    </p>
                  )}
                </div>

                {/* Service Rating */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Kualitas Pelayanan <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">Keramahan, kecepatan, dan profesionalitas staff</p>
                  <p className="text-xs text-gray-500 italic">1 bintang = buruk, 5 bintang = sangat baik</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick('serviceRating', star)}
                        className={`text-3xl transition-colors ${
                          star <= formData.serviceRating
                            ? 'text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {formData.serviceRating > 0 && (
                    <p className="text-sm text-center font-medium text-[#58ff34]">
                      {formData.serviceRating === 1 && 'Buruk Sekali'}
                      {formData.serviceRating === 2 && 'Kurang Baik'}
                      {formData.serviceRating === 3 && 'Cukup'}
                      {formData.serviceRating === 4 && 'Baik'}
                      {formData.serviceRating === 5 && 'Sangat Baik'}
                    </p>
                  )}
                </div>

                {/* Ambiance Rating */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Suasana Restoran <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">Kebersihan, kenyamanan, dan dekorasi ruangan</p>
                  <p className="text-xs text-gray-500 italic">1 bintang = buruk, 5 bintang = sangat baik</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick('ambianceRating', star)}
                        className={`text-3xl transition-colors ${
                          star <= formData.ambianceRating
                            ? 'text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {formData.ambianceRating > 0 && (
                    <p className="text-sm text-center font-medium text-[#58ff34]">
                      {formData.ambianceRating === 1 && 'Buruk Sekali'}
                      {formData.ambianceRating === 2 && 'Kurang Baik'}
                      {formData.ambianceRating === 3 && 'Cukup'}
                      {formData.ambianceRating === 4 && 'Baik'}
                      {formData.ambianceRating === 5 && 'Sangat Baik'}
                    </p>
                  )}
                </div>

                {/* Value Rating */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Harga & Value <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">Kesesuaian harga dengan kualitas yang didapat</p>
                  <p className="text-xs text-gray-500 italic">1 bintang = buruk, 5 bintang = sangat baik</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick('valueRating', star)}
                        className={`text-3xl transition-colors ${
                          star <= formData.valueRating
                            ? 'text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {formData.valueRating > 0 && (
                    <p className="text-sm text-center font-medium text-[#58ff34]">
                      {formData.valueRating === 1 && 'Buruk Sekali'}
                      {formData.valueRating === 2 && 'Kurang Baik'}
                      {formData.valueRating === 3 && 'Cukup'}
                      {formData.valueRating === 4 && 'Baik'}
                      {formData.valueRating === 5 && 'Sangat Baik'}
                    </p>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="comment">Komentar Umum</Label>
                  <Textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Ceritakan pengalaman Anda secara keseluruhan..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="liked">Apa yang Anda Sukai?</Label>
                  <Textarea
                    id="liked"
                    value={formData.liked}
                    onChange={(e) => setFormData({ ...formData, liked: e.target.value })}
                    placeholder="Hal-hal yang menurut Anda bagus..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disliked">Apa yang Perlu Ditingkatkan?</Label>
                  <Textarea
                    id="disliked"
                    value={formData.disliked}
                    onChange={(e) => setFormData({ ...formData, disliked: e.target.value })}
                    placeholder="Hal-hal yang perlu diperbaiki..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suggestions">Saran & Masukan</Label>
                  <Textarea
                    id="suggestions"
                    value={formData.suggestions}
                    onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                    placeholder="Saran untuk peningkatan layanan..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Would Recommend */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recommend"
                  checked={formData.wouldRecommend}
                  onChange={(e) => setFormData({ ...formData, wouldRecommend: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="recommend" className="text-sm font-normal cursor-pointer">
                  Saya akan merekomendasikan restoran ini kepada orang lain
                </Label>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Informasi Kontak (Opsional)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Nama</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="Nama Anda"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Nomor Telepon</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#58ff34] hover:bg-[#4de82a] text-black font-semibold py-6 text-lg"
              >
                {loading ? 'Mengirim...' : 'Kirim Feedback'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Terima kasih telah meluangkan waktu untuk memberikan feedback
        </p>
      </div>
    </div>
  )
}
