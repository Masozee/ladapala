'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

const LoginForm = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
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
      await login(formData.email, formData.password);

      // Redirect to main page
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal. Silakan periksa kredensial Anda.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left Side - Login Form */}
      <div className="w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-neutral-900">Ladapala POS</h1>
              <p className="text-sm text-neutral-600">Sistem Point of Sale Restoran</p>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-neutral-900">Selamat datang kembali</h2>
              <p className="mt-2 text-neutral-600">
                Masuk ke akun Anda untuk melanjutkan mengelola restoran Anda.
              </p>
            </div>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="nama@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pr-10"
                    placeholder="Masukkan password Anda"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-sm font-medium"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
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
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-neutral-700">
                    Ingat saya
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="text-neutral-900 hover:text-neutral-700 font-medium">
                    Lupa password?
                  </Link>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Masuk...</span>
                    </div>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-8">
              <div className="text-center">
                <p className="text-sm text-neutral-600">
                  Belum punya akun?{' '}
                  <Link href="/register" className="text-neutral-900 hover:text-neutral-700 font-medium">
                    Hubungi administrator Anda
                  </Link>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Right Side - Features */}
      <div className="w-1/2 relative">
        <div className="absolute inset-0 bg-black">
          {/* Background Image */}
          <div className="absolute inset-0"
               style={{
                 backgroundImage: `url("/jay-wennington-N_Y88TWmGwA-unsplash.jpg")`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 opacity: 0.6
               }}>
          </div>

          {/* Content - Empty, just showing background image */}
          <div className="relative h-full flex flex-col justify-center p-12 text-white">
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-black/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-black/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
};

export default LoginPage;
