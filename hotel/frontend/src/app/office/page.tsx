import OfficeLayout from '@/components/OfficeLayout';
import {
  Building03Icon,
  ArrowUp01Icon,
  UserMultipleIcon,
  CreditCardIcon,
  File01Icon,
  Settings02Icon,
  UserSettings01Icon,
  Clock01Icon,
  HotelIcon
} from '@/lib/icons';

export default function OfficePage() {
  return (
    <OfficeLayout>
      <div className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Pendapatan Bulanan</h3>
                  <p className="text-sm text-gray-600 mt-1">Total pendapatan bulan ini</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <ArrowUp01Icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">$45,231</div>
                <div className="text-sm text-gray-600">bulan ini</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Total Karyawan</h3>
                  <p className="text-sm text-gray-600 mt-1">Anggota staf aktif</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <UserMultipleIcon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">42</div>
                <div className="text-sm text-gray-600">karyawan</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Pembayaran Tertunda</h3>
                  <p className="text-sm text-gray-600 mt-1">Faktur yang belum dibayar</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <CreditCardIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">$8,420</div>
                <div className="text-sm text-gray-600">tertunda</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Laporan Dibuat</h3>
                  <p className="text-sm text-gray-600 mt-1">Bulan ini</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <File01Icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">28</div>
                <div className="text-sm text-gray-600">laporan</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Administrasi</h3>
                  <p className="text-sm text-gray-600 mt-1">Sistem dan manajemen hotel</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <Settings02Icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 space-y-3">
              <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <HotelIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Pengaturan Hotel</span>
                </div>
              </button>
              <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <UserSettings01Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Manajemen Pengguna</span>
                </div>
              </button>
              <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <ArrowUp01Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Analitik</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Keuangan</h3>
                  <p className="text-sm text-gray-600 mt-1">Manajemen pembayaran dan penagihan</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <CreditCardIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 space-y-3">
              <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <CreditCardIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Pembayaran</span>
                </div>
              </button>
              <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <File01Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Penagihan</span>
                </div>
              </button>
              <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <ArrowUp01Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Laporan Pendapatan</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Manajemen Staf</h3>
                  <p className="text-sm text-gray-600 mt-1">Alat karyawan dan penjadwalan</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <UserMultipleIcon className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 space-y-3">
              <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <UserMultipleIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Karyawan</span>
                </div>
              </button>
              <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Clock01Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Jadwal</span>
                </div>
              </button>
              <button className="w-full p-3 text-left bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <CreditCardIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Penggajian</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}