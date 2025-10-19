"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  Clock01Icon,
  UserIcon,
  Add01Icon,
  Edit01Icon,
  Delete01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  UserIcon as SingleUserIcon
} from "@hugeicons/core-free-icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api, type Staff, type Shift } from "@/lib/api"

const daysOfWeek = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

const ROLE_COLORS: Record<string, string> = {
  "CASHIER": "bg-purple-500",
  "KITCHEN": "bg-orange-500",
  "MANAGER": "bg-green-500",
  "WAREHOUSE": "bg-blue-500",
  "ADMIN": "bg-gray-600"
}

const ROLE_LABELS: Record<string, string> = {
  "CASHIER": "Kasir",
  "KITCHEN": "Dapur",
  "MANAGER": "Manager",
  "WAREHOUSE": "Gudang",
  "ADMIN": "Admin"
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<"week" | "day">("week")
  const [staff, setStaff] = useState<Staff[]>([])
  const [schedules, setSchedules] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    staff_id: '',
    date: '',
    shift_type: '',
    notes: ''
  })

  const SHIFT_TIMES: Record<string, { start: string; end: string }> = {
    'MORNING': { start: '06:00', end: '14:00' },
    'AFTERNOON': { start: '14:00', end: '22:00' },
    'EVENING': { start: '16:00', end: '00:00' },
    'NIGHT': { start: '22:00', end: '06:00' }
  }
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch all active staff for current branch
      const branchId = parseInt(process.env.NEXT_PUBLIC_API_BRANCH_ID || '5')
      const staffResponse = await api.getStaff({ branch: branchId, is_active: true })
      setStaff(staffResponse.results)

      // Fetch schedules for the current month using date range filter
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth()

      // Format dates properly to avoid timezone issues
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

      // Fetch schedules with date range filter (backend filtering)
      const schedulesResponse = await api.getSchedules({
        date_gte: startDate,
        date_lte: endDate
      })

      // Handle both paginated and non-paginated responses
      const schedulesList = Array.isArray(schedulesResponse) ? schedulesResponse : schedulesResponse.results

      console.log(`Fetched schedules from ${startDate} to ${endDate}:`, schedulesList.length)
      console.log('Unique dates in schedules:', [...new Set(schedulesList.map(s => s.shift_date))].sort())

      setSchedules(schedulesList)
    } catch (error) {
      console.error('Error fetching schedule data:', error)
      alert('Failed to fetch schedules: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const getMonthDates = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const dates = []

    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i))
    }
    return dates
  }

  const monthDates = getMonthDates(selectedDate)

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    setSelectedDate(newDate)
  }

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const shiftTimes = SHIFT_TIMES[formData.shift_type]

      await api.createSchedule({
        staff: parseInt(formData.staff_id),
        date: formData.date,
        start_time: shiftTimes.start,
        end_time: shiftTimes.end,
        shift_type: formData.shift_type,
        notes: formData.notes,
        is_confirmed: false
      })

      // Reset form
      setFormData({
        staff_id: '',
        date: '',
        shift_type: '',
        notes: ''
      })
      setIsAddDialogOpen(false)

      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error creating schedule:', error)
      alert('Gagal menambah shift: ' + (error as any).message)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (isConfirmed: boolean) => {
    return isConfirmed ? (
      <Badge className="bg-green-500 text-white text-xs">Dikonfirmasi</Badge>
    ) : (
      <Badge variant="outline" className="text-xs">Dijadwalkan</Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    return <Badge className={`${ROLE_COLORS[role] || "bg-gray-500"} text-white text-xs`}>{ROLE_LABELS[role] || role}</Badge>
  }

  const getShiftForEmployeeAndDate = (employeeId: number, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return schedules.find(s => s.employee === employeeId && s.shift_date === dateStr)
  }

  const getTodaySchedules = () => {
    const today = new Date().toISOString().split('T')[0]
    return schedules.filter(s => s.shift_date === today)
  }

  const getWeekStats = () => {
    const totalHours = schedules.reduce((sum, schedule) => sum + schedule.hours_scheduled, 0)
    const confirmedCount = schedules.filter(s => s.has_attendance).length
    const totalCount = schedules.length

    return {
      totalHours,
      attendanceRate: totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0,
      confirmedCount,
      totalCount
    }
  }

  const monthStats = getWeekStats() // Reusing same function for month stats
  const todaySchedules = getTodaySchedules()

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Jadwal Karyawan</h1>
          <p className="text-muted-foreground">Kelola jadwal shift dan kehadiran karyawan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded" onClick={fetchData}>
            <HugeiconsIcon icon={Calendar01Icon} size={16} strokeWidth={2} className="mr-2" />
            Refresh
          </Button>
          <Button className="rounded bg-[#58ff34] hover:bg-[#4de82a] text-black" onClick={() => setIsAddDialogOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} className="mr-2" />
            Tambah Shift
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
            <HugeiconsIcon icon={UserIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">Karyawan aktif</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shift Hari Ini</CardTitle>
            <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySchedules.length}</div>
            <p className="text-xs text-muted-foreground">Karyawan terjadwal</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jam</CardTitle>
            <HugeiconsIcon icon={Calendar01Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthStats.totalHours}</div>
            <p className="text-xs text-muted-foreground">Jam kerja terjadwal</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shift Dikonfirmasi</CardTitle>
            <HugeiconsIcon icon={SingleUserIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthStats.confirmedCount}/{monthStats.totalCount}</div>
            <p className="text-xs text-muted-foreground">{monthStats.totalCount > 0 ? `${Math.round((monthStats.confirmedCount/monthStats.totalCount)*100)}%` : '0%'} shift dikonfirmasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="schedule" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">Jadwal</TabsTrigger>
          <TabsTrigger value="employees" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">Karyawan</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          {/* Schedule Header */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Jadwal Shift ({monthDates.length} hari)</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded"
                  onClick={() => navigateMonth("prev")}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
                </Button>
                <div className="px-4 py-2 text-sm font-medium">
                  {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded"
                  onClick={() => navigateMonth("next")}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                </Button>
                <Button
                  variant="outline"
                  className="rounded text-[#58ff34] border-[#58ff34]"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Bulan Ini
                </Button>
                <Select value={selectedView} onValueChange={(value: "week" | "day") => setSelectedView(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Mingguan</SelectItem>
                    <SelectItem value="day">Harian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Schedule Content */}
          <div className="bg-white rounded-lg shadow-sm">
            {selectedView === "week" ? (
              <div className="relative">
                {/* Scrollable Container */}
                <div className="overflow-x-auto">
                  <div className="inline-flex">
                    {/* Frozen Employee Column */}
                    <div className="sticky left-0 z-20 bg-white border-r border-gray-200">
                      {/* Header */}
                      <div className="h-16 px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center">
                        <div className="font-semibold text-sm text-gray-700">Karyawan</div>
                      </div>
                      {/* Employee Rows */}
                      {staff.map(employee => {
                        const fullName = `${employee.user.first_name} ${employee.user.last_name}`
                        return (
                          <div
                            key={`name-${employee.id}`}
                            className="h-24 px-4 py-3 border-b border-gray-200 flex items-center"
                            style={{ minWidth: '200px' }}
                          >
                            <div>
                              <div className="font-medium text-sm text-gray-900">{fullName}</div>
                              <div className="mt-1">{getRoleBadge(employee.role)}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Scrollable Date Columns - Total: {monthDates.length} days */}
                    <div className="flex">
                      {monthDates.map((date, dateIndex) => {
                        const isToday = date.toDateString() === new Date().toDateString()
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6
                        return (
                          <div key={dateIndex} className="border-r border-gray-200 last:border-r-0" style={{ minWidth: '140px' }}>
                            {/* Date Header */}
                            <div className={`h-16 px-2 py-2 border-b border-gray-200 text-center ${isToday ? 'bg-[#58ff34]/10' : isWeekend ? 'bg-gray-100' : 'bg-gray-50'}`}>
                              <div className={`font-semibold text-xs ${isToday ? 'text-[#58ff34]' : isWeekend ? 'text-red-600' : 'text-gray-900'}`}>
                                {daysOfWeek[date.getDay()]}
                              </div>
                              <div className={`text-xl font-bold mt-1 ${isToday ? 'text-[#58ff34]' : isWeekend ? 'text-red-600' : 'text-gray-900'}`}>
                                {date.getDate()}
                              </div>
                            </div>
                            {/* Schedule Cells */}
                            {staff.map(employee => {
                              const shift = getShiftForEmployeeAndDate(employee.id, date)
                              return (
                                <div
                                  key={`${employee.id}-${dateIndex}`}
                                  className={`h-24 px-2 py-2 border-b border-gray-200 ${isToday ? 'bg-[#58ff34]/5' : isWeekend ? 'bg-gray-50' : ''}`}
                                >
                                  {shift ? (
                                    <div className="h-full flex flex-col justify-center space-y-1">
                                      <div className="text-[10px] font-semibold text-gray-900">
                                        {shift.start_time.slice(0,5)}-{shift.end_time.slice(0,5)}
                                      </div>
                                      <div className="text-[9px] text-gray-600 font-medium">
                                        {shift.shift_type}
                                      </div>
                                      {shift.has_attendance && (
                                        <div className="text-[8px] text-green-600">✓</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="h-full flex items-center justify-center">
                                      <span className="text-xs text-gray-300">-</span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {todaySchedules.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">Tidak ada jadwal hari ini</div>
                    <p className="text-sm text-gray-500">Pilih tanggal lain atau tambah shift baru</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Waktu</TableHead>
                        <TableHead>Karyawan</TableHead>
                        <TableHead>Posisi</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Jam</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todaySchedules.map((shift) => {
                        const employee = staff.find(s => s.id === shift.employee)
                        return (
                          <TableRow key={shift.id}>
                            <TableCell className="font-semibold">{shift.start_time.slice(0,5)} - {shift.end_time.slice(0,5)}</TableCell>
                            <TableCell className="font-medium">{shift.employee_name}</TableCell>
                            <TableCell>{employee && getRoleBadge(employee.role)}</TableCell>
                            <TableCell><Badge variant="outline">{shift.shift_type}</Badge></TableCell>
                            <TableCell>{getStatusBadge(shift.has_attendance)}</TableCell>
                            <TableCell className="text-right font-medium">{shift.hours_scheduled} jam</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Daftar Karyawan</h2>
              <p className="text-muted-foreground">Kelola informasi dan jadwal karyawan</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Karyawan</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Posisi</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((employee) => {
                  const fullName = `${employee.user.first_name} ${employee.user.last_name}`
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-mono text-sm">{employee.employee_id}</TableCell>
                      <TableCell className="font-medium">{fullName}</TableCell>
                      <TableCell>{getRoleBadge(employee.role)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{employee.user.email}</TableCell>
                      <TableCell>
                        {employee.is_active ? (
                          <Badge className="bg-green-500 text-white">Aktif</Badge>
                        ) : (
                          <Badge variant="outline">Nonaktif</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Shift Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Shift Baru</DialogTitle>
            <DialogDescription>
              Isi form di bawah untuk menambahkan jadwal shift baru
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddShift}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="staff">Karyawan</Label>
                <Select
                  value={formData.staff_id}
                  onValueChange={(value) => setFormData({...formData, staff_id: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.user.first_name} {s.user.last_name} - {ROLE_LABELS[s.role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="shift_type">Tipe Shift</Label>
                <Select
                  value={formData.shift_type}
                  onValueChange={(value) => setFormData({...formData, shift_type: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MORNING">Pagi (06:00-14:00)</SelectItem>
                    <SelectItem value="AFTERNOON">Siang (14:00-22:00)</SelectItem>
                    <SelectItem value="EVENING">Sore (16:00-00:00)</SelectItem>
                    <SelectItem value="NIGHT">Malam (22:00-06:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Tambahkan catatan jika diperlukan"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#58ff34] hover:bg-[#4de82a] text-black"
                disabled={submitting}
              >
                {submitting ? 'Menyimpan...' : 'Simpan Shift'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
