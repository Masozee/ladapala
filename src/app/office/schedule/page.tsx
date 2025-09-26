"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User
} from "lucide-react"
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

interface Shift {
  id: string
  employee: string
  role: string
  date: string
  startTime: string
  endTime: string
  status: "scheduled" | "confirmed" | "completed" | "absent"
}

interface Employee {
  id: string
  name: string
  role: string
  availability: string[]
  hoursThisWeek: number
  maxHours: number
}

const mockShifts: Shift[] = [
  {
    id: "1",
    employee: "Ahmad Rizki",
    role: "Kasir",
    date: "2024-01-15",
    startTime: "08:00",
    endTime: "16:00",
    status: "confirmed"
  },
  {
    id: "2",
    employee: "Siti Nurhaliza",
    role: "Koki",
    date: "2024-01-15",
    startTime: "06:00",
    endTime: "14:00",
    status: "confirmed"
  },
  {
    id: "3",
    employee: "Budi Santoso",
    role: "Pelayan",
    date: "2024-01-15",
    startTime: "10:00",
    endTime: "18:00",
    status: "scheduled"
  },
  {
    id: "4",
    employee: "Dewi Lestari",
    role: "Supervisor",
    date: "2024-01-15",
    startTime: "09:00",
    endTime: "17:00",
    status: "confirmed"
  }
]

const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "Ahmad Rizki",
    role: "Kasir",
    availability: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    hoursThisWeek: 32,
    maxHours: 40
  },
  {
    id: "2",
    name: "Siti Nurhaliza",
    role: "Koki",
    availability: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"],
    hoursThisWeek: 38,
    maxHours: 40
  },
  {
    id: "3",
    name: "Budi Santoso",
    role: "Pelayan",
    availability: ["Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"],
    hoursThisWeek: 24,
    maxHours: 35
  },
  {
    id: "4",
    name: "Dewi Lestari",
    role: "Supervisor",
    availability: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"],
    hoursThisWeek: 40,
    maxHours: 40
  }
]

const daysOfWeek = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<"week" | "day">("week")
  const [selectedRole, setSelectedRole] = useState("all")

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

  const getStatusBadge = (status: Shift["status"]) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline">Dijadwalkan</Badge>
      case "confirmed":
        return <Badge className="bg-green-500 text-white">Dikonfirmasi</Badge>
      case "completed":
        return <Badge className="bg-blue-500 text-white">Selesai</Badge>
      case "absent":
        return <Badge className="bg-red-500 text-white">Absen</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      "Kasir": "bg-purple-500",
      "Koki": "bg-orange-500",
      "Pelayan": "bg-blue-500",
      "Supervisor": "bg-green-500"
    }
    return <Badge className={`${colors[role] || "bg-gray-500"} text-white`}>{role}</Badge>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Jadwal Karyawan</h1>
          <p className="text-muted-foreground">Kelola jadwal shift dan kehadiran karyawan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded">
            <Calendar className="mr-2 h-4 w-4" />
            Template Jadwal
          </Button>
          <Button className="rounded bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Shift
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-lg border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEmployees.length}</div>
            <p className="text-xs text-muted-foreground">Karyawan aktif</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shift Hari Ini</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockShifts.filter(s => s.date === "2024-01-15").length}</div>
            <p className="text-xs text-muted-foreground">Karyawan terjadwal</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jam Minggu Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">134</div>
            <p className="text-xs text-muted-foreground">Jam kerja terjadwal</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kehadiran Hari Ini</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">3 dari 4 hadir</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Jadwal</TabsTrigger>
          <TabsTrigger value="employees">Karyawan</TabsTrigger>
          <TabsTrigger value="requests">Permintaan</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Card className="rounded-lg border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Jadwal Shift</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded"
                    onClick={() => navigateWeek("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
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
                    <ChevronRight className="h-4 w-4" />
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
            </CardHeader>
            <CardContent>
              {selectedView === "week" ? (
                <div className="grid grid-cols-8 gap-2">
                  <div className="font-medium text-sm text-muted-foreground">Karyawan</div>
                  {weekDates.map((date, index) => (
                    <div key={index} className="text-center">
                      <div className="font-medium text-sm">{daysOfWeek[date.getDay()]}</div>
                      <div className="text-xs text-muted-foreground">{date.getDate()}</div>
                    </div>
                  ))}
                  
                  {mockEmployees.map(employee => (
                    <>
                      <div key={employee.id} className="font-medium text-sm py-4 flex items-center">
                        <div>
                          <div>{employee.name}</div>
                          <div className="text-xs text-muted-foreground">{employee.role}</div>
                        </div>
                      </div>
                      {weekDates.map((date, index) => {
                        const shift = mockShifts.find(s => 
                          s.employee === employee.name && 
                          s.date === "2024-01-15"
                        )
                        return (
                          <div key={`${employee.id}-${index}`} className="border border-gray-200 rounded-lg p-2 min-h-[60px]">
                            {shift && index === 1 && (
                              <div className="text-xs space-y-1">
                                <div className="font-medium">{shift.startTime} - {shift.endTime}</div>
                                {getStatusBadge(shift.status)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Karyawan</TableHead>
                      <TableHead>Posisi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockShifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                        <TableCell className="font-medium">{shift.employee}</TableCell>
                        <TableCell>{getRoleBadge(shift.role)}</TableCell>
                        <TableCell>{getStatusBadge(shift.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="rounded">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card className="rounded-lg border-gray-200">
            <CardHeader>
              <CardTitle>Daftar Karyawan</CardTitle>
              <CardDescription>Kelola informasi dan ketersediaan karyawan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Posisi</TableHead>
                    <TableHead>Ketersediaan</TableHead>
                    <TableHead>Jam Minggu Ini</TableHead>
                    <TableHead>Max Jam</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{getRoleBadge(employee.role)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {employee.availability.slice(0, 3).map(day => (
                            <Badge key={day} variant="outline" className="text-xs">
                              {day.slice(0, 3)}
                            </Badge>
                          ))}
                          {employee.availability.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{employee.availability.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{employee.hoursThisWeek}</span>
                          {employee.hoursThisWeek >= employee.maxHours && (
                            <Badge className="bg-yellow-500 text-white text-xs">Max</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{employee.maxHours} jam</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card className="rounded-lg border-gray-200">
            <CardHeader>
              <CardTitle>Permintaan Cuti & Tukar Shift</CardTitle>
              <CardDescription>Kelola permintaan dari karyawan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-semibold">Ahmad Rizki - Permintaan Cuti</h4>
                    <p className="text-sm text-muted-foreground">20-22 Januari 2024 (3 hari)</p>
                    <p className="text-sm">Alasan: Acara keluarga</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded">Tolak</Button>
                    <Button size="sm" className="rounded bg-blue-600 hover:bg-blue-700">Setujui</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-semibold">Budi Santoso - Tukar Shift</h4>
                    <p className="text-sm text-muted-foreground">Dengan: Dewi Lestari</p>
                    <p className="text-sm">Tanggal: 18 Januari 2024 (10:00 - 18:00)</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">Menunggu Persetujuan Dewi</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  )
}