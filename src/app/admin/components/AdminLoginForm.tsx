"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ShieldCheck, Building } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useBranding } from "@/context/BrandingContext";

interface AdminLoginFormProps {
  adminUsername: string;
}

export default function AdminLoginForm({ adminUsername }: AdminLoginFormProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [greeting, setGreeting] = useState('');
  const router = useRouter();
  const branding = useBranding();
  
  // Set time-based greeting in Nepali
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('शुभ प्रभात'); // Good morning
    } else if (hour < 17) {
      setGreeting('शुभ दिन');    // Good day/afternoon
    } else {
      setGreeting('शुभ सन्ध्या'); // Good evening
    }
  }, []);
  
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
      toast.error('कृपया पासवर्ड प्रविष्ट गर्नुहोस्'); // Please enter your password
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
        toast.success('लगइन सफल भयो!'); // Login successful!
        router.push(`/admin/${adminUsername}`);
      } else {
        // Handle different error scenarios with appropriate messages
        if (response.status === 401) {
          toast.error('अवैध प्रयोगकर्ता नाम वा पासवर्ड'); // Invalid username or password
        } else if (response.status === 403) {
          if (data.message && data.message.includes('permission')) {
            toast.error('तपाईंसँग एडमिन ड्यासबोर्डमा पहुँच गर्ने अनुमति छैन'); // You don't have permission to access admin dashboard
          } else {
            toast.error('तपाईं एडमिन हुनुपर्छ'); // You must be an admin
          }
        } else {
          toast.error(data.message || 'लगइन असफल भयो'); // Login failed
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('लगइन प्रक्रियामा त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।'); // An error occurred during login. Please try again.
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
                    src={branding.logoPath}
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
              {branding.brandName || 'एडमिन पोर्टल'}
            </h1>
            <p className="text-gray-500 text-sm">
              {greeting}, <span className="font-semibold">{adminUsername}</span>
            </p>
            {branding.brandDescription && (
              <p className="mt-2 text-xs text-gray-500">{branding.brandDescription}</p>
            )}
          </div>
          
          {/* Login Form */}
          <div className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1.5">
                  पासवर्ड
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                    placeholder="पासवर्ड प्रविष्ट गर्नुहोस्"
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
                    लगइन गर्दै...
                  </>
                ) : (
                  'लगइन गर्नुहोस्'
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Back link */}
        <div className="text-center mt-6">
          <Link 
            href="/admin/login"
            className="text-sm text-gray-600 hover:text-primary transition-colors"
          >
            एडमिन लगइन पृष्ठमा फर्कनुहोस्
          </Link>
        </div>
      </div>
    </div>
  );
} 