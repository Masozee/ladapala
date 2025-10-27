import AppLayout from '@/components/AppLayout';
import {
  UserCheckIcon,
  Calendar01Icon,
  Door01Icon,
  BedIcon,
  UserMultipleIcon,
  Mail01Icon,
  QuestionIcon,
  PackageIcon,
  Wrench01Icon,
  HotelIcon
} from '@/lib/icons';

export default function FrontlinePage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center space-x-3">
            <UserCheckIcon className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-bold text-gray-900">Frontline Operations</h1>
          </div>
          <p className="text-gray-600 mt-2">Guest services and hotel operations management</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Check-ins</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
              <Door01Icon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">5 pending</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Check-outs</p>
                <p className="text-2xl font-bold text-gray-900">18</p>
              </div>
              <UserCheckIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">8 pending</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Rooms</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <BedIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Guest Requests</p>
                <p className="text-2xl font-bold text-gray-900">7</p>
              </div>
              <Mail01Icon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-2">
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">3 urgent</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar01Icon className="h-6 w-6 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">Reservations</h2>
            </div>
            <div className="space-y-3">
              <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar01Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Bookings</span>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">12</span>
                </div>
              </button>
              <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Door01Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Check-in</span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">5</span>
                </div>
              </button>
              <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <BedIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Room Status</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <UserMultipleIcon className="h-6 w-6 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">Guest Services</h2>
            </div>
            <div className="space-y-3">
              <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <UserMultipleIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Guest Profiles</span>
                </div>
              </button>
              <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail01Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Requests</span>
                  </div>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">3</span>
                </div>
              </button>
              <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <QuestionIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Complaints</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <HotelIcon className="h-6 w-6 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">Operations</h2>
            </div>
            <div className="space-y-3">
              <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <PackageIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Housekeeping</span>
                </div>
              </button>
              <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Wrench01Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Maintenance</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Door01Icon className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">John Smith checked in</p>
                  <p className="text-xs text-gray-600">Room 205 • 2:30 PM</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">5 mins ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail01Icon className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Guest requested extra towels</p>
                  <p className="text-xs text-gray-600">Room 312</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">12 mins ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <UserCheckIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Sarah Johnson checked out</p>
                  <p className="text-xs text-gray-600">Room 118 • 11:15 AM</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}