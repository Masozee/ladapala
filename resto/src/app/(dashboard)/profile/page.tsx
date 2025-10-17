'use client';

import { useState, useEffect } from 'react';
import { api, type AuthResponse, type Shift, type ProfileUpdateData } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<AuthResponse | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    address: '',
    date_of_birth: '',
  });

  useEffect(() => {
    fetchProfileData();
    fetchShifts();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await api.getUserProfile();
      setProfileData(response);

      // Set form data
      setFormData({
        first_name: response.user.first_name || '',
        last_name: response.user.last_name || '',
        phone: response.profile?.phone || '',
        bio: response.profile?.bio || '',
        address: response.profile?.address || '',
        date_of_birth: response.profile?.date_of_birth || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data profil' });
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await api.getUserShifts();
      setShifts(response.shifts);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updateData: ProfileUpdateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        bio: formData.bio,
        address: formData.address,
        date_of_birth: formData.date_of_birth || null,
      };

      await api.updateUserProfile(updateData);
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });

      // Refresh profile data
      await fetchProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Gagal memperbarui profil' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Memuat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profil Pengguna</h1>
        <p className="text-gray-600 mt-2">Kelola informasi profil dan jadwal Anda</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile">Informasi Profil</TabsTrigger>
          <TabsTrigger value="schedule">Jadwal Kerja</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Akun</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  value={profileData?.user.email || ''}
                  disabled
                  className="mt-1 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
              </div>

              {profileData?.employee && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">ID Karyawan</Label>
                    <Input
                      value={profileData.employee.employee_id}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Posisi</Label>
                    <Input
                      value={profileData.employee.position || '-'}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                  {profileData.employee.department && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Departemen</Label>
                      <Input
                        value={profileData.employee.department.name}
                        disabled
                        className="mt-1 bg-gray-50"
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pribadi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Nama Depan *</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nama Belakang</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="08xxxxxxxxxx"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Alamat</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1"
                    placeholder="Alamat lengkap"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1"
                    placeholder="Ceritakan tentang diri Anda..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={saving} className="flex-1">
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        first_name: profileData?.user.first_name || '',
                        last_name: profileData?.user.last_name || '',
                        phone: profileData?.profile?.phone || '',
                        bio: profileData?.profile?.bio || '',
                        address: profileData?.profile?.address || '',
                        date_of_birth: profileData?.profile?.date_of_birth || '',
                      });
                      setMessage(null);
                    }}
                  >
                    Batalkan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Kerja Anda</CardTitle>
            </CardHeader>
            <CardContent>
              {shifts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Tidak ada jadwal kerja yang tersedia</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Jadwal akan muncul setelah ditambahkan oleh administrator
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold text-gray-900">
                              {formatDate(shift.shift_date)}
                            </span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                shift.shift_type === 'MORNING'
                                  ? 'bg-blue-100 text-blue-800'
                                  : shift.shift_type === 'AFTERNOON'
                                  ? 'bg-green-100 text-green-800'
                                  : shift.shift_type === 'EVENING'
                                  ? 'bg-orange-100 text-orange-800'
                                  : shift.shift_type === 'NIGHT'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {shift.shift_type_display}
                            </span>
                            {shift.has_attendance && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Hadir
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              ⏰ {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                            </span>
                            <span>📅 {shift.hours_scheduled} jam</span>
                            <span>☕ Istirahat: {shift.break_duration} menit</span>
                          </div>
                          {shift.notes && (
                            <p className="text-sm text-gray-500 mt-2">
                              📝 {shift.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
