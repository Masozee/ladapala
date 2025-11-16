'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  ChevronLeftIcon,
  Cancel01Icon,
  UserCheckIcon
} from '@/lib/icons';

interface EditEmployeePageProps {
  params: Promise<{ id: string }>;
}

interface Department {
  id: number;
  name: string;
}

export default function EditEmployeePage({ params }: EditEmployeePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employeeDbId, setEmployeeDbId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    // User fields
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: '',

    // Employee fields
    department: '',
    position: '',
    salary: '',
    emergency_contact: '',
    emergency_phone: '',
    emergency_relationship: '',
  });

  const roles = [
    { value: 'STAFF', label: 'Staff' },
    { value: 'SUPERVISOR', label: 'Supervisor' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  useEffect(() => {
    fetchDepartments();
    fetchEmployee();
  }, [resolvedParams.id]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch(buildApiUrl('user/departments-manage/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const departmentsArray = data.results ? data.results : (Array.isArray(data) ? data : []);
        setDepartments(departmentsArray);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`user/employees/?employee_id=${resolvedParams.id}`), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const employees = data.results || data || [];
        const employee = employees.find((emp: any) => emp.employee_id === resolvedParams.id);

        if (employee) {
          setEmployeeDbId(employee.id);
          setFormData({
            first_name: employee.first_name || '',
            last_name: employee.last_name || '',
            phone: employee.phone || '',
            address: employee.address || '',
            date_of_birth: employee.date_of_birth || '',
            department: employee.department?.toString() || '',
            position: employee.position || '',
            salary: employee.salary || '',
            emergency_contact: employee.emergency_contact || '',
            emergency_phone: employee.emergency_phone || '',
            emergency_relationship: employee.emergency_relationship || '',
          });
        } else {
          alert('Employee not found');
          router.push('/office/employees');
        }
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      alert('Error loading employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeDbId) {
      alert('Employee ID not found');
      return;
    }

    try {
      setSaving(true);

      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`user/employees/${employeeDbId}/`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Employee updated successfully!');
        router.push(`/office/employees/${resolvedParams.id}`);
      } else {
        const error = await response.json();
        alert(`Failed to update employee: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('An error occurred while updating employee');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </OfficeLayout>
    );
  }

  return (
    <OfficeLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Karyawan</h1>
            <p className="text-sm text-gray-600 mt-1">Edit informasi karyawan {resolvedParams.id}</p>
          </div>
        </div>
      </div>

      {/* Form with Sections */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 space-y-8">
        {/* Informasi Pribadi */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Informasi Pribadi</h3>
            <p className="text-sm text-gray-500 mt-1">Data pribadi dan informasi kontak karyawan</p>
          </div>
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
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
              />
            </div>
          </div>
        </div>

        {/* Informasi Kepegawaian */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Informasi Kepegawaian</h3>
            <p className="text-sm text-gray-500 mt-1">Detail pekerjaan dan status kepegawaian</p>
          </div>
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

        {/* Kontak Darurat */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Kontak Darurat</h3>
            <p className="text-sm text-gray-500 mt-1">Informasi kontak yang dapat dihubungi saat keadaan darurat</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center space-x-2 px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Cancel01Icon className="h-4 w-4" />
            <span>Batal</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2.5 bg-[#4E61D3] text-white hover:bg-[#3d4fb5] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserCheckIcon className="h-4 w-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>
    </OfficeLayout>
  );
}
