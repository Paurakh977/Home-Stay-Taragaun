"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useBranding } from "@/context/BrandingContext";
import { getImageUrl } from "@/lib/utils";

interface OfficerLoginFormProps {
  adminUsername: string;
}

export default function OfficerLoginForm({ adminUsername }: OfficerLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [greeting, setGreeting] = useState('');
  const router = useRouter();
  const branding = useBranding();
  
  // Set time-based greeting in English
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning'); 
    } else if (hour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/officer/auth/me");
        if (response.ok) {
          const data = await response.json();
          // Already logged in, redirect to officer dashboard
          if (data.user?.parentAdmin === adminUsername) {
            router.push(`/officer/${adminUsername}`);
          }
        }
      } catch (error) {
        // Not logged in, continue showing login page
        console.error("Auth check error:", error);
      }
    };
    
    checkAuth();
  }, [router, adminUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter your username and password');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/officer/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          parentAdmin: adminUsername,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Login successful!');
        router.push(`/officer/${adminUsername}`);
      } else {
        // Handle different error scenarios with appropriate messages
        if (response.status === 401) {
          toast.error('Invalid username or password');
        } else if (response.status === 403) {
          if (data.message && data.message.includes('permission')) {
            toast.error('You do not have permission to access the dashboard');
          } else if (data.message && data.message.includes('inactive')) {
            toast.error('Your account is inactive. Please contact your admin.');
          } else {
            toast.error('Access denied');
          }
        } else {
          toast.error(data.message || 'Login failed');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card container with minimal shadow */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header with brand logo */}
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              {branding.logoPath ? (
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <Image
                    src={getImageUrl(branding.logoPath)}
                    alt={branding.brandName || 'Brand Logo'}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary text-white text-3xl font-bold shadow-sm">
                  {branding.brandName?.charAt(0) || adminUsername.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {branding.brandName || 'Officer Portal'}
            </h1>
            <p className="text-gray-500 text-sm">
              {greeting}, <span className="font-semibold">Officer</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Admin: {adminUsername}
            </p>
            {branding.brandDescription && (
              <p className="mt-2 text-xs text-gray-500">{branding.brandDescription}</p>
            )}
          </div>
          
          {/* Login Form */}
          <div className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>
              
              <div className="relative">
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-70 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Logging in...
                  </>
                ) : (
                  'Log in'
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Back link */}
        <div className="text-center mt-6">
          <Link 
            href="/officer/login"
            className="text-sm text-gray-600 hover:text-primary transition-colors"
          >
            Return to Officer Login
          </Link>
        </div>
      </div>
    </div>
  );
} 