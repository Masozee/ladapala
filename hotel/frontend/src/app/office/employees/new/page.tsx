'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  UserIcon,
  Mail01Icon,
  Call02Icon,
  Building03Icon,
  ChevronLeftIcon,
  Cancel01Icon,
  UserCheckIcon
} from '@/lib/icons';

interface Department {
  id: number;
  name: string;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    // User fields
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    role: 'STAFF',

    // Employee fields
    department: '',
    position: '',
    hire_date: new Date().toISOString().split('T')[0],
    salary: '',
    emergency_contact: '',
    emergency_phone: '',
    emergency_relationship: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(buildApiUrl('user/departments-manage/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Handle paginated response
        const departmentsArray = data.results ? data.results : (Array.isArray(data) ? data : []);
        setDepartments(departmentsArray);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      alert('Password tidak cocok!');
      return;
    }

    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      alert('Harap isi semua field yang wajib!');
      return;
    }

    setLoading(true);

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl('user/users/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          phone: formData.phone,
          department: formData.department,
          position: formData.position,
          hire_date: formData.hire_date,
          salary: formData.salary || 0,
        }),
      });

      if (response.ok) {
        alert('Karyawan berhasil ditambahkan!');
        router.push('/office/employees');
      } else {
        const error = await response.json();
        alert(`Gagal menambahkan karyawan: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Terjadi kesalahan saat menambahkan karyawan');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'STAFF', label: 'Staff' },
    { value: 'RECEPTIONIST', label: 'Receptionist' },
    { value: 'HOUSEKEEPING', label: 'Housekeeping' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  return (
    <OfficeLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tambah Karyawan Baru</h1>
            <p className="text-sm text-gray-600 mt-1">Isi formulir untuk menambahkan karyawan baru</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
          {/* Account Information */}
          <div className="bg-white border border-gray-200 mb-6">
            <div className="p-6 bg-[#4E61D3] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Informasi Akun</h3>
                  <p className="text-sm text-gray-100 mt-1">Data login dan akses sistem</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-[#4E61D3]" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    placeholder="nama@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    placeholder="Minimal 8 karakter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    placeholder="Ketik ulang password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white border border-gray-200 mb-6">
            <div className="p-6 bg-[#4E61D3] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Informasi Pribadi</h3>
                  <p className="text-sm text-gray-100 mt-1">Data pribadi karyawan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <UserCheckIcon className="h-4 w-4 text-[#4E61D3]" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Depan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Belakang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    placeholder="+62"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="bg-white border border-gray-200 mb-6">
            <div className="p-6 bg-[#4E61D3] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Informasi Kepegawaian</h3>
                  <p className="text-sm text-gray-100 mt-1">Data pekerjaan dan posisi</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Building03Icon className="h-4 w-4 text-[#4E61D3]" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departemen <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  >
                    <option value="">Pilih Departemen</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Posisi
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Bergabung
                  </label>
                  <input
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gaji (Rp)
                  </label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white border border-gray-200 mb-6">
            <div className="p-6 bg-[#4E61D3] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Kontak Darurat</h3>
                  <p className="text-sm text-gray-100 mt-1">Informasi kontak untuk keadaan darurat</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Call02Icon className="h-4 w-4 text-[#4E61D3]" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Kontak
                  </label>
                  <input
                    type="text"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    name="emergency_phone"
                    value={formData.emergency_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hubungan
                  </label>
                  <input
                    type="text"
                    name="emergency_relationship"
                    value={formData.emergency_relationship}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    placeholder="e.g. Suami, Istri, Orang Tua"
                  />
                </div>
              </div>
            </div>
          </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Cancel01Icon className="h-4 w-4" />
            <span>Batal</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-[#4E61D3] text-white hover:bg-[#3d4fb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserCheckIcon className="h-4 w-4" />
            <span>{loading ? 'Menyimpan...' : 'Simpan Karyawan'}</span>
          </button>
        </div>
      </form>
    </OfficeLayout>
  );
}
