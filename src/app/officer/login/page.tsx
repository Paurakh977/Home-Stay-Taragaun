"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react";
import Link from "next/link";

export default function OfficerLoginPage() {
  const [searchUsername, setSearchUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/officer/auth/me");
        if (response.ok) {
          // Get the username
          const data = await response.json();
          const officerData = data.user;
          
          if (officerData?.username && officerData?.parentAdmin) {
            // Already logged in, redirect to officer-specific dashboard
            router.push(`/officer/${officerData.parentAdmin}`);
            return;
          }
        }
        // Not logged in, continue showing login page
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchUsername.trim()) {
      toast.error('Please enter an admin username');
      return;
    }
    
    // Redirect to the officer-specific login page
    router.push(`/officer/${searchUsername}/login`);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Officer Login</h1>
        <p className="text-gray-600 text-center mb-8">
          Enter your admin's username to continue
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="sr-only">
              Admin Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your admin's username"
                autoComplete="off"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Loading...
              </>
            ) : (
              'Continue to Login'
            )}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <Link 
            href="/"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
} 