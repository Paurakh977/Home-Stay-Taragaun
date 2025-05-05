"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Lock, User } from 'lucide-react';
import Image from 'next/image';
import { useBranding } from '@/context/BrandingContext';

interface AdminLoginClientProps {
  adminUsername: string;
}

export default function AdminLoginClient({ adminUsername }: AdminLoginClientProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const branding = useBranding();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't allow empty password
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: adminUsername, 
          password 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Login successful');
        router.push(`/admin/${adminUsername}`);
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-xl shadow-md">
      <div className="text-center">
        {/* Brand Logo */}
        <div className="flex justify-center mb-4">
          {branding.logoPath ? (
            <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <Image
                src={branding.logoPath}
                alt={branding.brandName || 'Brand Logo'}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          ) : (
            <div className="h-20 w-20 bg-primary rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-sm">
              {branding.brandName?.charAt(0) || adminUsername.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          {branding.brandName || 'Admin Portal'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          <span className="font-medium text-primary">
            {adminUsername}
          </span>
          {branding.brandDescription && (
            <span className="block mt-1 text-xs text-gray-500">{branding.brandDescription}</span>
          )}
        </p>
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <input type="hidden" name="username" value={adminUsername} />
        
        <div className="rounded-md shadow-sm -space-y-px">
          <div className="mb-5">
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                value={adminUsername}
                readOnly
                disabled
                className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 bg-gray-100 text-gray-500 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Username"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 