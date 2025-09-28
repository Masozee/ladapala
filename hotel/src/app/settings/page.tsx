'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Settings,
  Building,
  User,
  Mail,
  Shield,
  CreditCard,
  Bell,
  Globe,
  Database,
  Wifi,
  Printer,
  Calendar,
  Clock,
  Users,
  Bed,
  DollarSign,
  FileText,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  X,
  AlertCircle,
  Info,
  Moon,
  Sun,
  Smartphone
} from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    general: {
      hotelName: 'Kapulaga Hotel',
      hotelDescription: 'Premium hospitality experience in the heart of the city',
      address: 'Jl. Sudirman No. 123, Jakarta 10220',
      phone: '+62-21-5555-0123',
      email: 'info@kapulaga.com',
      website: 'https://kapulaga.com',
      timezone: 'Asia/Jakarta',
      currency: 'IDR',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24'
    },
    // User Management
    users: {
      allowSelfRegistration: false,
      requireEmailVerification: true,
      passwordMinLength: 8,
      sessionTimeout: 120,
      maxLoginAttempts: 5,
      twoFactorAuth: true,
      passwordExpiry: 90,
      enforceStrongPassword: true
    },
    // Notifications
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      bookingNotifications: true,
      maintenanceAlerts: true,
      paymentAlerts: true,
      guestRequestAlerts: true,
      systemAlerts: true,
      notificationSound: true
    },
    // Security
    security: {
      enableSSL: true,
      enableFirewall: true,
      enableRateLimiting: true,
      auditLogging: true,
      dataEncryption: true,
      backupEncryption: true,
      ipWhitelist: '',
      sessionSecurity: 'high',
      apiKeyRotation: 30
    },
    // Payment
    payment: {
      defaultGateway: 'stripe',
      acceptCreditCards: true,
      acceptDebitCards: true,
      acceptBankTransfer: true,
      acceptCash: true,
      autoCharge: false,
      invoicePrefix: 'INV',
      taxRate: 11,
      lateFee: 5,
      refundPolicy: 'flexible'
    },
    // Room Management
    rooms: {
      autoAssignRooms: true,
      allowOverbooking: false,
      overbookingLimit: 5,
      defaultCheckInTime: '14:00',
      defaultCheckOutTime: '12:00',
      gracePeriodMinutes: 30,
      autoRoomStatus: true,
      roomMaintenanceAlerts: true,
      housekeepingNotifications: true
    },
    // Booking
    booking: {
      advanceBookingDays: 365,
      minimumBookingDays: 1,
      cancellationPeriod: 24,
      confirmationRequired: true,
      autoConfirmation: false,
      waitingListEnabled: true,
      groupBookingMinimum: 10,
      seasonalPricing: true,
      dynamicPricing: false
    },
    // Integrations
    integrations: {
      pmsEnabled: true,
      channelManager: true,
      keyCardSystem: true,
      phoneSystem: false,
      accountingSoftware: true,
      crmSystem: false,
      emailMarketing: true,
      analyticsTracking: true,
      socialMediaIntegration: false
    },
    // Appearance
    appearance: {
      theme: 'light',
      primaryColor: '#005357',
      secondaryColor: '#2baf6a',
      fontFamily: 'Inter',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico',
      customCss: '',
      enableAnimations: true,
      compactLayout: false
    },
    // Backup & Maintenance
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      backupLocation: 'cloud',
      maintenanceMode: false,
      maintenanceMessage: 'System under maintenance. Please try again later.',
      debugMode: false,
      performanceMode: 'balanced'
    }
  });

  const [showPasswords, setShowPasswords] = useState({});

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const togglePassword = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const tabs = [
    {
      id: 'general',
      name: 'Info',
      icon: Settings,
      description: 'Basic hotel information and system settings'
    },
    {
      id: 'users',
      name: 'Users',
      icon: Users,
      description: 'User management and authentication settings'
    },
    {
      id: 'notifications',
      name: 'Alerts',
      icon: Bell,
      description: 'Notification preferences and alert settings'
    },
    {
      id: 'security',
      name: 'Security',
      icon: Shield,
      description: 'Security policies and access controls'
    },
    {
      id: 'payment',
      name: 'Payment',
      icon: CreditCard,
      description: 'Payment gateways and billing settings'
    },
    {
      id: 'rooms',
      name: 'Rooms',
      icon: Bed,
      description: 'Room management and housekeeping settings'
    },
    {
      id: 'booking',
      name: 'Booking',
      icon: Calendar,
      description: 'Reservation policies and booking rules'
    },
    {
      id: 'integrations',
      name: 'API',
      icon: Wifi,
      description: 'Third-party services and API connections'
    },
    {
      id: 'appearance',
      name: 'Theme',
      icon: Eye,
      description: 'Themes, colors, and visual customization'
    },
    {
      id: 'backup',
      name: 'Backup',
      icon: Database,
      description: 'Data backup and system maintenance'
    }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-white shadow">
        <div className="p-6 bg-[#005357] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Hotel Information</h3>
              <p className="text-sm text-gray-100 mt-1">Basic details about your hotel</p>
            </div>
            <div className="w-8 h-8 bg-white flex items-center justify-center">
              <Building className="h-4 w-4 text-[#005357]" />
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name</label>
              <input
                type="text"
                value={settings.general.hotelName}
                onChange={(e) => handleSettingChange('general', 'hotelName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={settings.general.email}
                onChange={(e) => handleSettingChange('general', 'email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={settings.general.hotelDescription}
                onChange={(e) => handleSettingChange('general', 'hotelDescription', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={settings.general.address}
                onChange={(e) => handleSettingChange('general', 'address', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={settings.general.phone}
                onChange={(e) => handleSettingChange('general', 'phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={settings.general.website}
                onChange={(e) => handleSettingChange('general', 'website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow">
        <div className="p-6 bg-[#005357] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Regional Settings</h3>
              <p className="text-sm text-gray-100 mt-1">Localization and format preferences</p>
            </div>
            <div className="w-8 h-8 bg-white flex items-center justify-center">
              <Globe className="h-4 w-4 text-[#005357]" />
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={settings.general.timezone}
                onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
              >
                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={settings.general.currency}
                onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
              >
                <option value="IDR">Indonesian Rupiah (IDR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={settings.general.language}
                onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
              >
                <option value="en">English</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={settings.general.dateFormat}
                onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <div className="bg-white shadow">
        <div className="p-6 bg-[#005357] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Authentication Settings</h3>
              <p className="text-sm text-gray-100 mt-1">User registration and login policies</p>
            </div>
            <div className="w-8 h-8 bg-white flex items-center justify-center">
              <User className="h-4 w-4 text-[#005357]" />
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">Allow Self Registration</label>
                <p className="text-sm text-gray-500">Allow users to create accounts without admin approval</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.users.allowSelfRegistration}
                  onChange={(e) => handleSettingChange('users', 'allowSelfRegistration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#005357]/25 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005357]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">Require Email Verification</label>
                <p className="text-sm text-gray-500">Users must verify their email before accessing the system</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.users.requireEmailVerification}
                  onChange={(e) => handleSettingChange('users', 'requireEmailVerification', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#005357]/25 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005357]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                <p className="text-sm text-gray-500">Require 2FA for enhanced security</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.users.twoFactorAuth}
                  onChange={(e) => handleSettingChange('users', 'twoFactorAuth', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#005357]/25 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005357]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password Min Length</label>
                <input
                  type="number"
                  value={settings.users.passwordMinLength}
                  onChange={(e) => handleSettingChange('users', 'passwordMinLength', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
                  min="6"
                  max="32"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.users.sessionTimeout}
                  onChange={(e) => handleSettingChange('users', 'sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
                  min="15"
                  max="480"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.users.maxLoginAttempts}
                  onChange={(e) => handleSettingChange('users', 'maxLoginAttempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357]"
                  min="3"
                  max="10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white shadow">
        <div className="p-6 bg-[#005357] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Notification Channels</h3>
              <p className="text-sm text-gray-100 mt-1">Choose how you want to receive notifications</p>
            </div>
            <div className="w-8 h-8 bg-white flex items-center justify-center">
              <Bell className="h-4 w-4 text-[#005357]" />
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-white border">
              <div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-[#005357]" />
                  <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                </div>
                <p className="text-sm text-gray-500 mt-1">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#005357]/25 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005357]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-white border">
              <div>
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-[#005357]" />
                  <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                </div>
                <p className="text-sm text-gray-500 mt-1">Receive notifications via SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.smsNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#005357]/25 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005357]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-white border">
              <div>
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-[#005357]" />
                  <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                </div>
                <p className="text-sm text-gray-500 mt-1">Browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.pushNotifications}
                  onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#005357]/25 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005357]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-white border">
              <div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-[#005357]" />
                  <label className="text-sm font-medium text-gray-700">Notification Sound</label>
                </div>
                <p className="text-sm text-gray-500 mt-1">Play sound for notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.notificationSound}
                  onChange={(e) => handleSettingChange('notifications', 'notificationSound', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#005357]/25 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005357]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow">
        <div className="p-6 bg-[#005357] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Alert Types</h3>
              <p className="text-sm text-gray-100 mt-1">Choose which events trigger notifications</p>
            </div>
            <div className="w-8 h-8 bg-white flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-[#005357]" />
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50">
          <div className="space-y-4">
            {[
              { key: 'bookingNotifications', label: 'Booking Notifications', icon: Calendar },
              { key: 'maintenanceAlerts', label: 'Maintenance Alerts', icon: Settings },
              { key: 'paymentAlerts', label: 'Payment Alerts', icon: CreditCard },
              { key: 'guestRequestAlerts', label: 'Guest Request Alerts', icon: User },
              { key: 'systemAlerts', label: 'System Alerts', icon: AlertCircle }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-white border">
                <div className="flex items-center space-x-3">
                  <item.icon className="h-5 w-5 text-[#005357]" />
                  <label className="text-sm font-medium text-gray-700">{item.label}</label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                    onChange={(e) => handleSettingChange('notifications', item.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#005357]/25 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005357]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'users':
        return renderUserSettings();
      case 'notifications':
        return renderNotificationSettings();
      default:
        return (
          <div className="bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Coming Soon</h3>
                  <p className="text-sm text-gray-100 mt-1">This section is under development</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Settings className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="text-center py-12">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Coming Soon</h3>
                <p className="text-gray-600">This settings section is currently being developed and will be available soon.</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-2">Configure your hotel management system settings and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#005357] text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Description */}
        <div className="bg-blue-50 p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                {tabs.find(tab => tab.id === activeTab)?.name} Settings
              </h4>
              <p className="text-sm text-blue-800 mt-1">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        {renderContent()}

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <button className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-3 bg-[#005357] text-white hover:bg-[#004147] transition-colors">
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;