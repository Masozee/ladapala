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

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch all active staff for branch 4
      const staffResponse = await api.getStaff({ branch: 4, is_active: true })
      setStaff(staffResponse.results)

      // Fetch schedules for the current week
      const weekDates = getWeekDates(selectedDate)
      const startDate = weekDates[0].toISOString().split('T')[0]
      const endDate = weekDates[6].toISOString().split('T')[0]

      // Fetch all schedules in the date range
      const schedulesResponse = await api.getSchedules({})

      // Filter schedules for the current week
      const filteredSchedules = schedulesResponse.results.filter(schedule => {
        const scheduleDate = new Date(schedule.shift_date)
        return scheduleDate >= weekDates[0] && scheduleDate <= weekDates[6]
      })

      setSchedules(filteredSchedules)
    } catch (error) {
      console.error('Error fetching schedule data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const weekDates = getWeekDates(selectedDate)

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    setSelectedDate(newDate)
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

  const weekStats = getWeekStats()
  const todaySchedules = getTodaySchedules()

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading schedules...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
          <Button className="rounded bg-[#58ff34] hover:bg-[#4de82a] text-black">
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
            <CardTitle className="text-sm font-medium">Total Jam Minggu Ini</CardTitle>
            <HugeiconsIcon icon={Calendar01Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekStats.totalHours}</div>
            <p className="text-xs text-muted-foreground">Jam kerja terjadwal</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shift Dikonfirmasi</CardTitle>
            <HugeiconsIcon icon={SingleUserIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekStats.confirmedCount}/{weekStats.totalCount}</div>
            <p className="text-xs text-muted-foreground">{weekStats.totalCount > 0 ? `${Math.round((weekStats.confirmedCount/weekStats.totalCount)*100)}%` : '0%'} shift dikonfirmasi</p>
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
              <h2 className="text-lg font-semibold">Jadwal Shift</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded"
                  onClick={() => navigateWeek("prev")}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
                </Button>
                <div className="px-4 py-2 text-sm font-medium">
                  {weekDates[0].getDate()} - {weekDates[6].getDate()} {monthNames[weekDates[6].getMonth()]} {weekDates[6].getFullYear()}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded"
                  onClick={() => navigateWeek("next")}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
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
          <div className="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
            {selectedView === "week" ? (
              <div className="grid grid-cols-8 gap-2 min-w-[1000px]">
                <div className="font-medium text-sm text-muted-foreground">Karyawan</div>
                {weekDates.map((date, index) => (
                  <div key={index} className="text-center">
                    <div className="font-medium text-sm">{daysOfWeek[date.getDay()]}</div>
                    <div className="text-xs text-muted-foreground">{date.getDate()}</div>
                  </div>
                ))}

                {staff.map(employee => {
                  const fullName = `${employee.user_first_name} ${employee.user_last_name}`
                  return (
                    <React.Fragment key={employee.id}>
                      <div className="font-medium text-sm py-4 flex items-center">
                        <div>
                          <div>{fullName}</div>
                          <div className="text-xs">{getRoleBadge(employee.role)}</div>
                        </div>
                      </div>
                      {weekDates.map((date, index) => {
                        const shift = getShiftForEmployeeAndDate(employee.id, date)
                        return (
                          <div key={`${employee.id}-${index}`} className="border border-gray-200 rounded-lg p-2 min-h-[80px]">
                            {shift && (
                              <div className="text-xs space-y-1">
                                <div className="font-medium">{shift.start_time.slice(0,5)} - {shift.end_time.slice(0,5)}</div>
                                <div className="text-[10px] text-gray-500">{shift.shift_type}</div>
                                {getStatusBadge(shift.has_attendance)}
                                <div className="text-[10px] text-gray-500">{shift.hours_scheduled}h</div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Posisi</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaySchedules.map((shift) => {
                    const employee = staff.find(s => s.id === shift.employee)
                    return (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.start_time.slice(0,5)} - {shift.end_time.slice(0,5)}</TableCell>
                        <TableCell>{shift.employee_name}</TableCell>
                        <TableCell>{employee && getRoleBadge(employee.role)}</TableCell>
                        <TableCell><Badge variant="outline">{shift.shift_type}</Badge></TableCell>
                        <TableCell>{getStatusBadge(shift.has_attendance)}</TableCell>
                        <TableCell>{shift.hours_scheduled} jam</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
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
                  const fullName = `${employee.user_first_name} ${employee.user_last_name}`
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-mono text-sm">{employee.employee_id}</TableCell>
                      <TableCell className="font-medium">{fullName}</TableCell>
                      <TableCell>{getRoleBadge(employee.role)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{employee.user_email}</TableCell>
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
    </div>
  )
}
