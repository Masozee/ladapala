'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  EyeIcon,
  HotelIcon,
  Shield01Icon,
  Mail01Icon,
  UserIcon,
  UserCheckIcon
} from '@/lib/icons';
import { buildApiUrl } from '@/lib/config';

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hotelInfo, setHotelInfo] = useState<any>(null);

  // Get redirect path from query params
  const redirectPath = searchParams.get('redirect') || '/';

  // Fetch CSRF token and hotel info on mount
  useEffect(() => {
    fetch(buildApiUrl('user/csrf/'), {
      credentials: 'include'
    }).catch(err => console.error('Error fetching CSRF token:', err));

    // Fetch hotel public information
    fetch(buildApiUrl('hotel/settings/public_info/'), {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => setHotelInfo(data))
      .catch(err => console.error('Error fetching hotel info:', err));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Get CSRF token first
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      const response = await fetch(buildApiUrl('user/login/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid username or password');
      }

      const data = await response.json();

      // Store auth data in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      if (data.employee) {
        localStorage.setItem('authEmployee', JSON.stringify(data.employee));
      }
      if (data.access) {
        localStorage.setItem('authAccess', JSON.stringify(data.access));
      }

      // Redirect based on access level or original page
      if (redirectPath !== '/') {
        router.push(redirectPath);
      } else {
        // Redirect to appropriate default route based on department
        const access = data.access;
        if (access) {
          if (access.can_access_main) {
            router.push('/');
          } else if (access.can_access_office) {
            router.push('/office');
          } else if (access.can_access_support) {
            router.push('/support');
          } else {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: HotelIcon,
      title: 'Complete Hotel Management',
      description: 'Manage rooms, reservations, guests, and operations from one unified platform'
    },
    {
      icon: Shield01Icon,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime guarantee for your peace of mind'
    },
    {
      icon: UserCheckIcon,
      title: 'Proven Results',
      description: 'Used by 500+ hotels worldwide with average 30% efficiency improvement'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gray-50 flex items-center justify-center p-1">
                <Image
                  src={hotelInfo?.logo_url || '/logo.png'}
                  alt={`${hotelInfo?.hotel_name || 'Hotel'} Logo`}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {hotelInfo?.hotel_name || 'Kapulaga'}
                </h1>
                <p className="text-sm text-gray-600">Hotel Management System</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-2 text-gray-600">
                {hotelInfo?.hotel_description || 'Sign in to your account to continue managing your hotel operations.'}
              </p>
            </div>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-14 pr-3 py-3 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005357] focus:border-[#005357]"
                    placeholder="Enter your email"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-8 h-8 bg-gray-100 flex items-center justify-center">
                      <Mail01Icon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-14 pr-10 py-3 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005357] focus:border-[#005357]"
                    placeholder="Enter your password"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-8 h-8 bg-gray-100 flex items-center justify-center">
                      <Shield01Icon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#005357] focus:ring-[#005357] border-gray-300"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="text-[#005357] hover:text-[#004147] font-medium">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium text-white bg-[#005357] hover:bg-[#004147] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005357] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-[#005357] hover:text-[#004147] font-medium">
                    Contact your administrator
                  </Link>
                </p>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials:</h4>
              <div className="space-y-1 text-xs text-blue-800">
                <div><strong>Admin:</strong> admin@gmail.com / 687654</div>
              </div>
            </div>

            {/* Hotel Contact Information */}
            {hotelInfo && (hotelInfo.phone || hotelInfo.email || hotelInfo.address) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Need Help?</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  {hotelInfo.phone && (
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{hotelInfo.phone}</span>
                    </div>
                  )}
                  {hotelInfo.email && (
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{hotelInfo.email}</span>
                    </div>
                  )}
                  {hotelInfo.address && (
                    <div className="flex items-start space-x-2">
                      <svg className="h-4 w-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="flex-1">{hotelInfo.address}</span>
                    </div>
                  )}
                  {hotelInfo.website && (
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <a href={hotelInfo.website} target="_blank" rel="noopener noreferrer" className="text-[#005357] hover:text-[#004147]">
                        {hotelInfo.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Image and Features */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#005357] to-[#2baf6a]"
          style={{
            background: hotelInfo?.primary_color
              ? `linear-gradient(to bottom right, ${hotelInfo.primary_color}, ${hotelInfo.secondary_color || hotelInfo.primary_color})`
              : undefined
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10" 
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                 backgroundSize: '30px 30px'
               }}>
          </div>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-center p-12 text-white">
            <div className="max-w-lg">
              <h2 className="text-4xl font-bold mb-6">
                {hotelInfo?.hotel_name || 'Streamline Your Hotel Operations'}
              </h2>
              <p className="text-xl text-gray-100 mb-12">
                {hotelInfo?.hotel_description || 'Experience the power of modern hotel management - where efficiency meets excellence in hospitality.'}
              </p>

              {/* Features List */}
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white/20 flex items-center justify-center">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                      <p className="text-gray-100 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-12 pt-8 border-t border-white/20">
                <div className="grid grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-3xl font-bold">500+</div>
                    <div className="text-sm text-gray-100">Hotels</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">99.9%</div>
                    <div className="text-sm text-gray-100">Uptime</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">24/7</div>
                    <div className="text-sm text-gray-100">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;