'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Hotel, Lock, Mail, User, Shield, CheckCircle } from 'lucide-react';
import { buildApiUrl } from '@/lib/config';

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await fetch(buildApiUrl('auth/login/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
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

      // Redirect to complaints page
      router.push('/complaints');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Hotel,
      title: 'Complete Hotel Management',
      description: 'Manage rooms, reservations, guests, and operations from one unified platform'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime guarantee for your peace of mind'
    },
    {
      icon: CheckCircle,
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
                  src="/logo.png"
                  alt="Kapulaga Hotel Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kapulaga</h1>
                <p className="text-sm text-gray-600">Hotel Management System</p>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-2 text-gray-600">
                Sign in to your account to continue managing your hotel operations.
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
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1 relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-14 pr-3 py-3 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005357] focus:border-[#005357]"
                    placeholder="Enter your username"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-8 h-8 bg-gray-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
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
                      <Lock className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
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
                <div><strong>Admin:</strong> admin / admin123</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Image and Features */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-[#005357] to-[#2baf6a]">
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
                Streamline Your Hotel Operations
              </h2>
              <p className="text-xl text-gray-100 mb-12">
                Experience the power of modern hotel management with Kapulaga - 
                where efficiency meets excellence in hospitality.
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