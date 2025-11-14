"use client"

import { useState, useEffect } from "react"
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
  Notification01Icon,
  SecurityCheckIcon,
  Database01Icon,
  PrinterIcon,
  CheckmarkCircle01Icon,
  Building02Icon
} from "@hugeicons/core-free-icons"
import { api, type RestaurantSettings as APISettings } from "@/lib/api"

interface RestaurantSettings {
  name: string
  address: string
  phone: string
  email: string
  serialNumber: string
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

interface SecuritySettings {
  minPasswordLength: number
  passwordExpiryDays: number
  requireSpecialChars: boolean
  requireNumbers: boolean
  enableTwoFactor: boolean
  enableIpRestriction: boolean
  maxLoginAttempts: number
  enableDataEncryption: boolean
  anonymizeLogs: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsId, setSettingsId] = useState<number | null>(null)
  const [restaurantId, setRestaurantId] = useState<number | null>(null)
  const [testingPrinter, setTestingPrinter] = useState<string | null>(null)

  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>({
    name: "",
    address: "",
    phone: "",
    email: "",
    serialNumber: "",
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
    kitchenPrinter: "",
    barPrinter: "",
    receiptPrinter: "",
    enableAutoPrint: true,
    printReceipts: true,
    printKitchenOrders: true
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    minPasswordLength: 8,
    passwordExpiryDays: 90,
    requireSpecialChars: true,
    requireNumbers: true,
    enableTwoFactor: false,
    enableIpRestriction: false,
    maxLoginAttempts: 3,
    enableDataEncryption: true,
    anonymizeLogs: true
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const data = await api.getCurrentSettings()
      setSettingsId(data.id)
      setRestaurantId(data.restaurant)

      // Map API data to local state
      setRestaurantSettings({
        name: data.restaurant_name || "",
        address: data.restaurant_address || "",
        phone: data.restaurant_phone || "",
        email: data.restaurant_email || "",
        serialNumber: data.restaurant_serial_number || "",
        taxRate: parseFloat(data.tax_rate) || 11,
        currency: data.currency || "IDR",
        timezone: data.timezone || "Asia/Jakarta"
      })

      setNotifications({
        lowStockAlerts: data.low_stock_alerts,
        newOrderAlerts: data.new_order_alerts,
        emailNotifications: data.email_notifications,
        smsNotifications: data.sms_notifications,
        dailyReports: data.daily_reports,
        weeklyReports: data.weekly_reports
      })

      setSystemSettings({
        autoBackup: data.auto_backup,
        backupFrequency: data.backup_frequency,
        dataRetention: data.data_retention_days,
        enableAuditLog: data.enable_audit_log,
        sessionTimeout: data.session_timeout_minutes
      })

      setPrinterSettings({
        kitchenPrinter: data.kitchen_printer_ip || "",
        barPrinter: data.bar_printer_ip || "",
        receiptPrinter: data.receipt_printer_ip || "",
        enableAutoPrint: data.enable_auto_print,
        printReceipts: data.print_receipts,
        printKitchenOrders: data.print_kitchen_orders
      })

      setSecuritySettings({
        minPasswordLength: data.min_password_length,
        passwordExpiryDays: data.password_expiry_days,
        requireSpecialChars: data.require_special_chars,
        requireNumbers: data.require_numbers,
        enableTwoFactor: data.enable_two_factor,
        enableIpRestriction: data.enable_ip_restriction,
        maxLoginAttempts: data.max_login_attempts,
        enableDataEncryption: data.enable_data_encryption,
        anonymizeLogs: data.anonymize_logs
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
      alert('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settingsId || !restaurantId) {
      alert('Pengaturan belum dimuat')
      return
    }

    try {
      setSaving(true)

      // Update restaurant info
      await api.updateRestaurant(restaurantId, {
        name: restaurantSettings.name,
        address: restaurantSettings.address,
        phone: restaurantSettings.phone,
        email: restaurantSettings.email,
        serial_number: restaurantSettings.serialNumber
      })

      // Map local state to API format for settings
      const updateData: Partial<APISettings> = {
        tax_rate: restaurantSettings.taxRate.toString(),
        currency: restaurantSettings.currency,
        timezone: restaurantSettings.timezone,
        low_stock_alerts: notifications.lowStockAlerts,
        new_order_alerts: notifications.newOrderAlerts,
        email_notifications: notifications.emailNotifications,
        sms_notifications: notifications.smsNotifications,
        daily_reports: notifications.dailyReports,
        weekly_reports: notifications.weeklyReports,
        auto_backup: systemSettings.autoBackup,
        backup_frequency: systemSettings.backupFrequency,
        data_retention_days: systemSettings.dataRetention,
        enable_audit_log: systemSettings.enableAuditLog,
        session_timeout_minutes: systemSettings.sessionTimeout,
        kitchen_printer_ip: printerSettings.kitchenPrinter,
        bar_printer_ip: printerSettings.barPrinter,
        receipt_printer_ip: printerSettings.receiptPrinter,
        enable_auto_print: printerSettings.enableAutoPrint,
        print_receipts: printerSettings.printReceipts,
        print_kitchen_orders: printerSettings.printKitchenOrders,
        min_password_length: securitySettings.minPasswordLength,
        password_expiry_days: securitySettings.passwordExpiryDays,
        require_special_chars: securitySettings.requireSpecialChars,
        require_numbers: securitySettings.requireNumbers,
        enable_two_factor: securitySettings.enableTwoFactor,
        enable_ip_restriction: securitySettings.enableIpRestriction,
        max_login_attempts: securitySettings.maxLoginAttempts,
        enable_data_encryption: securitySettings.enableDataEncryption,
        anonymize_logs: securitySettings.anonymizeLogs
      }

      await api.updateSettings(settingsId, updateData)
      alert("Pengaturan berhasil disimpan!")
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  const handleTestPrinter = async (printerType: 'kitchen' | 'bar' | 'receipt') => {
    let ipAddress = ''

    if (printerType === 'kitchen') ipAddress = printerSettings.kitchenPrinter
    else if (printerType === 'bar') ipAddress = printerSettings.barPrinter
    else if (printerType === 'receipt') ipAddress = printerSettings.receiptPrinter

    if (!ipAddress.trim()) {
      alert('Masukkan IP address terlebih dahulu')
      return
    }

    try {
      setTestingPrinter(printerType)
      const response = await fetch('http://localhost:8000/api/settings/test_printer/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ip_address: ipAddress })
      })

      const data = await response.json()

      if (data.error) {
        alert(`Error: ${data.error}`)
      } else if (data.success) {
        alert(`Berhasil!\n${data.message || 'Printer dapat dijangkau'}`)
      } else {
        alert(`Gagal!\n${data.message || 'Printer tidak dapat dijangkau'}`)
      }
    } catch (error: any) {
      console.error('Error testing printer:', error)
      alert(`Error: ${error.message || 'Gagal menghubungi server'}`)
    } finally {
      setTestingPrinter(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58ff34] mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat pengaturan...</p>
          </div>
        </div>
      </div>
    )
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
          disabled={saving}
          className="bg-[#58ff34] hover:bg-[#4de82a] text-black"
        >
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} strokeWidth={2} className="mr-2 h-4 w-4" />
          {saving ? 'Menyimpan...' : 'Simpan Semua'}
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
          <div className="bg-white p-6 rounded-lg">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Informasi Restoran</h2>
              <p className="text-muted-foreground">Informasi dasar restoran</p>
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
                <Label htmlFor="serial-number">Nomor Seri</Label>
                <Input
                  id="serial-number"
                  value={restaurantSettings.serialNumber}
                  onChange={(e) => setRestaurantSettings({
                    ...restaurantSettings,
                    serialNumber: e.target.value
                  })}
                  placeholder="SN-XXXXX-XXXXX"
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
          <div className="bg-white p-6 rounded-lg">
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
          <div className="bg-white p-6 rounded-lg">
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
          <div className="bg-white p-6 rounded-lg">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Pengaturan Printer</h2>
              <p className="text-muted-foreground">Konfigurasi printer untuk kitchen dan kasir</p>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>IP Printer Kitchen</Label>
                  <div className="flex gap-2">
                    <Input
                      value={printerSettings.kitchenPrinter}
                      onChange={(e) => setPrinterSettings({
                        ...printerSettings,
                        kitchenPrinter: e.target.value
                      })}
                      placeholder="192.168.1.100"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleTestPrinter('kitchen')}
                      disabled={testingPrinter === 'kitchen'}
                    >
                      {testingPrinter === 'kitchen' ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Untuk mencetak order makanan
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>IP Printer Bar</Label>
                  <div className="flex gap-2">
                    <Input
                      value={printerSettings.barPrinter}
                      onChange={(e) => setPrinterSettings({
                        ...printerSettings,
                        barPrinter: e.target.value
                      })}
                      placeholder="192.168.1.101"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleTestPrinter('bar')}
                      disabled={testingPrinter === 'bar'}
                    >
                      {testingPrinter === 'bar' ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Untuk mencetak order minuman
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>IP Printer Kasir</Label>
                  <div className="flex gap-2">
                    <Input
                      value={printerSettings.receiptPrinter}
                      onChange={(e) => setPrinterSettings({
                        ...printerSettings,
                        receiptPrinter: e.target.value
                      })}
                      placeholder="192.168.1.102"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleTestPrinter('receipt')}
                      disabled={testingPrinter === 'receipt'}
                    >
                      {testingPrinter === 'receipt' ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Untuk mencetak struk pembayaran
                  </p>
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
          <div className="bg-white p-6 rounded-lg">
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
                      <Input
                        type="number"
                        value={securitySettings.minPasswordLength}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          minPasswordLength: parseInt(e.target.value)
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Masa Berlaku Password (hari)</Label>
                      <Input
                        type="number"
                        value={securitySettings.passwordExpiryDays}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          passwordExpiryDays: parseInt(e.target.value)
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Wajib Karakter Khusus</Label>
                    <Switch
                      checked={securitySettings.requireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        requireSpecialChars: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Wajib Angka</Label>
                    <Switch
                      checked={securitySettings.requireNumbers}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        requireNumbers: checked
                      })}
                    />
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
                    <Switch
                      checked={securitySettings.enableTwoFactor}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        enableTwoFactor: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Login IP Restriction</Label>
                      <p className="text-sm text-muted-foreground">Batasi login dari IP tertentu</p>
                    </div>
                    <Switch
                      checked={securitySettings.enableIpRestriction}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        enableIpRestriction: checked
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings({
                        ...securitySettings,
                        maxLoginAttempts: parseInt(e.target.value)
                      })}
                    />
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
                    <Switch
                      checked={securitySettings.enableDataEncryption}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        enableDataEncryption: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Anonymize Logs</Label>
                      <p className="text-sm text-muted-foreground">Anonimkan data personal di logs</p>
                    </div>
                    <Switch
                      checked={securitySettings.anonymizeLogs}
                      onCheckedChange={(checked) => setSecuritySettings({
                        ...securitySettings,
                        anonymizeLogs: checked
                      })}
                    />
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
