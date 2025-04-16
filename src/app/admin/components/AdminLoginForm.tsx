"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ShieldCheck, Building } from "lucide-react";
import Link from "next/link";

interface AdminLoginFormProps {
  adminUsername: string;
}

export default function AdminLoginForm({ adminUsername }: AdminLoginFormProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/auth/me");
        if (response.ok) {
          // Already logged in, redirect to admin dashboard
          router.push(`/admin/${adminUsername}`);
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
    
    if (!password) {
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
          password,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Login successful!');
        router.push(`/admin/${adminUsername}`);
      } else {
        // Handle different error scenarios with appropriate messages
        if (response.status === 401) {
          toast.error('Invalid username or password');
        } else if (response.status === 403) {
          if (data.message && data.message.includes('permission')) {
            toast.error('You do not have permission to access the admin dashboard');
          } else {
            toast.error('You must be an admin to access this area');
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card container with improved shadow */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with brand color */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <p className="mt-1 text-blue-100 text-sm">Login as {adminUsername}</p>
          </div>
          
          {/* Login Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={adminUsername}
                    readOnly
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 bg-gray-100 rounded-lg focus:outline-none text-gray-700"
                    placeholder="Enter your username"
                  />
                  <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:opacity-70 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Back link */}
        <div className="text-center mt-6">
          <Link 
            href="/admin/login"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Back to Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
} 