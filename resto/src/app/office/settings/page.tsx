"use client"

import { useState } from "react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Settings01Icon,
  Store01Icon,
  Notification01Icon,
  SecurityCheckIcon,
  Database01Icon,
  PrinterIcon,
  CheckmarkCircle01Icon,
  Building02Icon
} from "@hugeicons/core-free-icons"

interface RestaurantSettings {
  name: string
  address: string
  phone: string
  email: string
  taxRate: number
  currency: string
  timezone: string
}

interface NotificationSettings {
  lowStockAlerts: boolean
  newOrderAlerts: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  dailyReports: boolean
  weeklyReports: boolean
}

interface SystemSettings {
  autoBackup: boolean
  backupFrequency: string
  dataRetention: number
  enableAuditLog: boolean
  sessionTimeout: number
}

export default function SettingsPage() {
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>({
    name: "Ladapala Restaurant",
    address: "Jl. Merdeka No. 123, Jakarta",
    phone: "+62 21 1234 5678",
    email: "info@ladapala.com",
    taxRate: 11,
    currency: "IDR",
    timezone: "Asia/Jakarta"
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    lowStockAlerts: true,
    newOrderAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
    dailyReports: true,
    weeklyReports: true
  })

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    autoBackup: true,
    backupFrequency: "daily",
    dataRetention: 365,
    enableAuditLog: true,
    sessionTimeout: 30
  })

  const [printerSettings, setPrinterSettings] = useState({
    kitchenPrinter: "192.168.1.100",
    receiptPrinter: "192.168.1.101",
    enableAutoPrint: true,
    printReceipts: true,
    printKitchenOrders: true
  })

  const handleSave = () => {
    // In a real app, this would save to backend
    console.log("Settings saved:", {
      restaurantSettings,
      notifications,
      systemSettings,
      printerSettings
    })
    // Show success message
    alert("Pengaturan berhasil disimpan!")
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola konfigurasi sistem dan preferensi</p>
        </div>
        <Button 
          onClick={handleSave}
          className="bg-[#58ff34] hover:bg-[#4de82a] text-black"
        >
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} strokeWidth={2} className="mr-2 h-4 w-4" />
          Simpan Semua
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="restaurant" className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="restaurant" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">
            <HugeiconsIcon icon={Building02Icon} size={16} strokeWidth={2} className="mr-2" />
            Restoran
          </TabsTrigger>
          <TabsTrigger value="notifications" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">
            <HugeiconsIcon icon={Notification01Icon} size={16} strokeWidth={2} className="mr-2 h-4 w-4" />
            Notifikasi
          </TabsTrigger>
          <TabsTrigger value="system" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">
            <HugeiconsIcon icon={Database01Icon} size={16} strokeWidth={2} className="mr-2 h-4 w-4" />
            Sistem
          </TabsTrigger>
          <TabsTrigger value="printer" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">
            <HugeiconsIcon icon={PrinterIcon} size={16} strokeWidth={2} className="mr-2 h-4 w-4" />
            Printer
          </TabsTrigger>
          <TabsTrigger value="security" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">
            <HugeiconsIcon icon={SecurityCheckIcon} size={16} strokeWidth={2} className="mr-2 h-4 w-4" />
            Keamanan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="restaurant" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Informasi Restoran</h2>
              <p className="text-muted-foreground">Kelola informasi dasar restoran</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="restaurant-name">Nama Restoran</Label>
                <Input
                  id="restaurant-name"
                  value={restaurantSettings.name}
                  onChange={(e) => setRestaurantSettings({
                    ...restaurantSettings,
                    name: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  value={restaurantSettings.phone}
                  onChange={(e) => setRestaurantSettings({
                    ...restaurantSettings,
                    phone: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={restaurantSettings.address}
                  onChange={(e) => setRestaurantSettings({
                    ...restaurantSettings,
                    address: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={restaurantSettings.email}
                  onChange={(e) => setRestaurantSettings({
                    ...restaurantSettings,
                    email: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tax-rate">Pajak (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  value={restaurantSettings.taxRate}
                  onChange={(e) => setRestaurantSettings({
                    ...restaurantSettings,
                    taxRate: parseFloat(e.target.value)
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Mata Uang</Label>
                <Select 
                  value={restaurantSettings.currency}
                  onValueChange={(value) => setRestaurantSettings({
                    ...restaurantSettings,
                    currency: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Waktu</Label>
                <Select 
                  value={restaurantSettings.timezone}
                  onValueChange={(value) => setRestaurantSettings({
                    ...restaurantSettings,
                    timezone: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Jakarta">WIB (UTC+7)</SelectItem>
                    <SelectItem value="Asia/Makassar">WITA (UTC+8)</SelectItem>
                    <SelectItem value="Asia/Jayapura">WIT (UTC+9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Pengaturan Notifikasi</h2>
              <p className="text-muted-foreground">Atur notifikasi dan peringatan sistem</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Peringatan Operasional</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Peringatan Stok Rendah</Label>
                      <p className="text-sm text-muted-foreground">Notifikasi saat stok bahan baku rendah</p>
                    </div>
                    <Switch
                      checked={notifications.lowStockAlerts}
                      onCheckedChange={(checked) => setNotifications({
                        ...notifications,
                        lowStockAlerts: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Pesanan Baru</Label>
                      <p className="text-sm text-muted-foreground">Notifikasi untuk pesanan baru</p>
                    </div>
                    <Switch
                      checked={notifications.newOrderAlerts}
                      onCheckedChange={(checked) => setNotifications({
                        ...notifications,
                        newOrderAlerts: checked
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Metode Notifikasi</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-muted-foreground">Kirim notifikasi via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications({
                        ...notifications,
                        emailNotifications: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS</Label>
                      <p className="text-sm text-muted-foreground">Kirim notifikasi via SMS</p>
                    </div>
                    <Switch
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) => setNotifications({
                        ...notifications,
                        smsNotifications: checked
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Laporan Otomatis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Laporan Harian</Label>
                      <p className="text-sm text-muted-foreground">Kirim laporan harian otomatis</p>
                    </div>
                    <Switch
                      checked={notifications.dailyReports}
                      onCheckedChange={(checked) => setNotifications({
                        ...notifications,
                        dailyReports: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Laporan Mingguan</Label>
                      <p className="text-sm text-muted-foreground">Kirim laporan mingguan otomatis</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => setNotifications({
                        ...notifications,
                        weeklyReports: checked
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Pengaturan Sistem</h2>
              <p className="text-muted-foreground">Konfigurasi backup, penyimpanan, dan performa</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Backup & Penyimpanan</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Backup Otomatis</Label>
                      <p className="text-sm text-muted-foreground">Aktifkan backup otomatis database</p>
                    </div>
                    <Switch
                      checked={systemSettings.autoBackup}
                      onCheckedChange={(checked) => setSystemSettings({
                        ...systemSettings,
                        autoBackup: checked
                      })}
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Frekuensi Backup</Label>
                      <Select 
                        value={systemSettings.backupFrequency}
                        onValueChange={(value) => setSystemSettings({
                          ...systemSettings,
                          backupFrequency: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Setiap Jam</SelectItem>
                          <SelectItem value="daily">Harian</SelectItem>
                          <SelectItem value="weekly">Mingguan</SelectItem>
                          <SelectItem value="monthly">Bulanan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Retensi Data (hari)</Label>
                      <Input
                        type="number"
                        value={systemSettings.dataRetention}
                        onChange={(e) => setSystemSettings({
                          ...systemSettings,
                          dataRetention: parseInt(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Keamanan & Monitoring</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Log Audit</Label>
                      <p className="text-sm text-muted-foreground">Catat semua aktivitas pengguna</p>
                    </div>
                    <Switch
                      checked={systemSettings.enableAuditLog}
                      onCheckedChange={(checked) => setSystemSettings({
                        ...systemSettings,
                        enableAuditLog: checked
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Timeout Sesi (menit)</Label>
                    <Input
                      type="number"
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        sessionTimeout: parseInt(e.target.value)
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="printer" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Pengaturan Printer</h2>
              <p className="text-muted-foreground">Konfigurasi printer untuk kitchen dan kasir</p>
            </div>
            
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>IP Printer Kitchen</Label>
                  <Input
                    value={printerSettings.kitchenPrinter}
                    onChange={(e) => setPrinterSettings({
                      ...printerSettings,
                      kitchenPrinter: e.target.value
                    })}
                    placeholder="192.168.1.100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>IP Printer Kasir</Label>
                  <Input
                    value={printerSettings.receiptPrinter}
                    onChange={(e) => setPrinterSettings({
                      ...printerSettings,
                      receiptPrinter: e.target.value
                    })}
                    placeholder="192.168.1.101"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Opsi Cetak</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cetak Otomatis</Label>
                      <p className="text-sm text-muted-foreground">Cetak otomatis saat ada pesanan baru</p>
                    </div>
                    <Switch
                      checked={printerSettings.enableAutoPrint}
                      onCheckedChange={(checked) => setPrinterSettings({
                        ...printerSettings,
                        enableAutoPrint: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cetak Struk</Label>
                      <p className="text-sm text-muted-foreground">Cetak struk pembayaran</p>
                    </div>
                    <Switch
                      checked={printerSettings.printReceipts}
                      onCheckedChange={(checked) => setPrinterSettings({
                        ...printerSettings,
                        printReceipts: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cetak Order Kitchen</Label>
                      <p className="text-sm text-muted-foreground">Cetak order untuk kitchen</p>
                    </div>
                    <Switch
                      checked={printerSettings.printKitchenOrders}
                      onCheckedChange={(checked) => setPrinterSettings({
                        ...printerSettings,
                        printKitchenOrders: checked
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline">Test Printer Kitchen</Button>
                <Button variant="outline">Test Printer Kasir</Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Keamanan</h2>
              <p className="text-muted-foreground">Pengaturan keamanan dan akses pengguna</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Kebijakan Password</h3>
                <div className="space-y-3">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Panjang Minimum Password</Label>
                      <Input type="number" defaultValue="8" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Masa Berlaku Password (hari)</Label>
                      <Input type="number" defaultValue="90" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Wajib Karakter Khusus</Label>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Wajib Angka</Label>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Akses & Kontrol</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Aktifkan autentikasi dua faktor</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Login IP Restriction</Label>
                      <p className="text-sm text-muted-foreground">Batasi login dari IP tertentu</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input type="number" defaultValue="3" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium">Data Privacy</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enkripsi Data</Label>
                      <p className="text-sm text-muted-foreground">Enkripsi data sensitif</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Anonymize Logs</Label>
                      <p className="text-sm text-muted-foreground">Anonimkan data personal di logs</p>
                    </div>
                    <Switch checked={true} onCheckedChange={() => {}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}