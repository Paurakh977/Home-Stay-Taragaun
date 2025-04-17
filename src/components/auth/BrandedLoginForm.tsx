'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useBranding } from '@/context/BrandingContext';
import { getImageUrl } from '@/lib/utils';

interface BrandedLoginFormProps {
  adminUsername?: string;
}

export default function BrandedLoginForm({ adminUsername }: BrandedLoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    homestayId: '',
    password: '',
  });
  const router = useRouter();
  const branding = useBranding();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...formData,
          adminUsername // Include adminUsername if it exists
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'लगइन असफल भयो');
      }

      const data = await response.json();

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify({
        homestayId: data.homestayId,
        homeStayName: data.homeStayName,
      }));

      // Redirect to dashboard (with admin path if applicable)
      const dashboardPath = adminUsername ? `/${adminUsername}/dashboard` : '/dashboard';
      router.push(dashboardPath);
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'लगइन गर्न असमर्थ');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo */}
        <div className="flex justify-center">
          {branding.logoPath ? (
            <div className="relative h-24 w-24 mb-5">
              <Image
                src={getImageUrl(branding.logoPath)}
                alt={branding.brandName || 'Brand Logo'}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="h-20 w-20 bg-primary rounded-full flex items-center justify-center text-white font-bold text-3xl mb-5">
              {branding.brandName?.charAt(0) || 'H'}
            </div>
          )}
        </div>
        
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
          {branding.brandName || 'हाम्रो होम स्टे'}
        </h2>
        <p className="text-center text-xl text-primary font-medium">
          आफ्नो खातामा लगइन गर्नुहोस्
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          वा{' '}
          <Link
            href={`${adminUsername ? `/${adminUsername}` : ""}/register`}
            className="font-medium text-primary hover:text-indigo-500"
          >
            आफ्नो होमस्टे दर्ता गर्नुहोस्
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="homestayId" className="block text-sm font-medium text-gray-700">
                होमस्टे आईडी
              </label>
              <div className="mt-1">
                <input
                  id="homestayId"
                  name="homestayId"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.homestayId}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                पासवर्ड
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? 
                    <EyeOffIcon className="h-5 w-5 text-gray-400" /> : 
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  }
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                  मलाई सम्झनुहोस्
                </label>
              </div>

              <div className="text-sm">
                <Link href="/reset-password" className="font-medium text-primary hover:text-indigo-500">
                  पासवर्ड बिर्सनुभयो?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'लगइन गर्दै...' : 'लगइन गर्नुहोस्'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 