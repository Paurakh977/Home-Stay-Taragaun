'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';

export default function RefinedMinimalistLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string; general?: string}>({});
  
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const newErrors: {email?: string; password?: string; general?: string} = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    if (!isLoaded) {
      setErrors({ general: 'Authentication system is loading. Please try again.' });
      setIsLoading(false);
      return;
    }

    try {
      // Start the sign-in process with Clerk
      const result = await signIn.create({
        identifier: email,
        password: password,
      });
      
      // Check the status of the sign-in
      if (result.status === 'complete') {
        // Sign-in was successful, set the active session
        await setActive({ session: result.createdSessionId });
        
        // Get the redirect URL from search params or default to '/'
        const redirectUrl = searchParams.get('redirect_url') || '/';
        router.push(redirectUrl);
      } else {
        // Handle 2FA or other cases
        setErrors({ general: 'Sign in requires additional steps. Please continue in the flow.' });
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrors({ general: err.errors?.[0]?.message || 'Invalid email or password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'oauth_google' | 'oauth_facebook' | 'oauth_apple') => {
    if (!isLoaded) {
      return;
    }

    try {
      setIsLoading(true);
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err) {
      console.error('Social login error:', err);
      setErrors({ general: 'Could not sign in with social provider. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8 select-none">
            <motion.div 
              className="w-40 h-40 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Image 
                src="/Logo.png" 
                alt="Nepal StayLink Logo" 
                width={140} 
                height={140} 
                className="object-contain" 
              />
            </motion.div>
            <h1 className="text-3xl tracking-tight text-slate-800 mb-1 pointer-events-none">
              <span className="font-semibold">Welcome to</span> <span className="text-[#183636] font-semibold">Nepal StayLink</span>
            </h1>
            <p className="text-[13px] font-light tracking-wider text-slate-400 uppercase pointer-events-none">Sign in to continue</p>
          </div>

          {errors.general && (
            <motion.div 
              className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-6 text-center"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
            >
              {errors.general}
            </motion.div>
          )}

          {/* Form */}
          <motion.form 
            className="space-y-5"
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Email Field */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                  errors.email ? 'border-red-300' : 'border-slate-200'
                } placeholder-slate-300 text-slate-700 font-light tracking-wide`}
                placeholder="Email address"
                style={{ fontSize: '14px' }}
              />
              {errors.email && (
                <motion.p 
                  className="mt-1 text-[11px] text-red-500 font-light tracking-wide"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.email}
                </motion.p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.25 }}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                  errors.password ? 'border-red-300' : 'border-slate-200'
                } placeholder-slate-300 text-slate-700 font-light tracking-wide`}
                placeholder="Password"
                style={{ fontSize: '14px' }}
              />
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 z-10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </motion.button>
              {errors.password && (
                <motion.p 
                  className="mt-1 text-[11px] text-red-500 font-light tracking-wide"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.password}
                </motion.p>
              )}
            </motion.div>

            {/* Remember Me & Forgot Password */}
            <motion.div 
              className="flex items-center justify-between text-[12px]"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.35 }}
            >
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-[#183636] focus:ring-[#183636] focus:ring-offset-0"
                />
                <span className="ml-2 text-slate-500 font-light tracking-wide">Remember me</span>
              </label>
              <motion.a 
                href="#" 
                className="text-[#183636] hover:text-[#1c4141] transition-colors font-light tracking-wide"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.1 }}
              >
                Forgot password?
              </motion.a>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#183636] to-[#1c4141] text-white py-3 px-4 rounded-xl font-medium tracking-wider text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden group transform-gpu shadow-lg"
              style={{ 
                boxShadow: '0 6px 16px rgba(24, 54, 54, 0.2), 0 3px 6px rgba(24, 54, 54, 0.12), 0 1px 3px rgba(24, 54, 54, 0.14), 0 0 0 1px rgba(24, 54, 54, 0.05)',
                transform: 'translateY(-2px)'
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.2, 
                delay: 0.45,
                y: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }
              }}
              whileHover={{ 
                y: -6,
                boxShadow: '0 18px 30px rgba(24, 54, 54, 0.25), 0 8px 12px rgba(24, 54, 54, 0.2), 0 1px 4px rgba(24, 54, 54, 0.15), 0 0 0 1px rgba(24, 54, 54, 0.1)',
                transition: { 
                  duration: 0.3,
                  y: {
                    type: "spring",
                    stiffness: 500,
                    damping: 20
                  }
                }
              }}
              whileTap={{ 
                y: -1,
                boxShadow: '0 8px 15px rgba(24, 54, 54, 0.2), 0 3px 6px rgba(24, 54, 54, 0.12), 0 0 0 1px rgba(24, 54, 54, 0.05)',
                transition: { duration: 0.1 }
              }}
            >
              <span className="absolute inset-0 w-0 bg-gradient-to-r from-[#1c4141] to-[#183636] transition-all duration-300 ease-out group-hover:w-full"></span>
              <span className="relative">
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in'
                )}
              </span>
            </motion.button>

            {/* Divider */}
            <motion.div 
              className="relative my-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="px-4 bg-white text-slate-400 font-light tracking-wider uppercase">or continue with</span>
              </div>
            </motion.div>

            {/* This div is required for Clerk captcha */}
            <div id="clerk-captcha" className="hidden"></div>
          </motion.form>

          {/* Social Buttons (moved outside form for cleaner organization) */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <motion.button
              type="button"
              onClick={() => handleSocialLogin('oauth_google')}
              className="flex justify-center items-center h-11 bg-white border border-slate-200 rounded-xl overflow-hidden relative group transform-gpu shadow-[0_4px_10px_-2px_rgba(0,0,0,0.1)]"
              style={{ transform: "translateY(-2px)" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.2, 
                delay: 0.6,
                y: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }
              }}
              whileHover={{ 
                y: -6,
                boxShadow: '0 20px 35px -7px rgba(0, 0, 0, 0.2)',
                transition: { 
                  duration: 0.3,
                  y: {
                    type: "spring",
                    stiffness: 500,
                    damping: 20
                  }
                }
              }}
              whileTap={{ 
                y: -3,
                boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.15)',
                transition: { duration: 0.1 }
              }}
            >
              <span className="absolute inset-0 w-0 bg-slate-900 transition-all duration-300 ease-out group-hover:w-full"></span>
              <svg className="w-5 h-5 relative z-10 transition-all duration-300 group-hover:brightness-0 group-hover:invert" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => handleSocialLogin('oauth_facebook')}
              className="flex justify-center items-center h-11 bg-white border border-slate-200 rounded-xl overflow-hidden relative group transform-gpu shadow-[0_4px_10px_-2px_rgba(0,0,0,0.1)]"
              style={{ transform: "translateY(-2px)" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.2, 
                delay: 0.7,
                y: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }
              }}
              whileHover={{ 
                y: -6,
                boxShadow: '0 20px 35px -7px rgba(0, 0, 0, 0.2)',
                transition: { 
                  duration: 0.3,
                  y: {
                    type: "spring",
                    stiffness: 500,
                    damping: 20
                  }
                }
              }}
              whileTap={{ 
                y: -3,
                boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.15)',
                transition: { duration: 0.1 }
              }}
            >
              <span className="absolute inset-0 w-0 bg-slate-900 transition-all duration-300 ease-out group-hover:w-full"></span>
              <svg className="w-5 h-5 relative z-10 transition-all duration-300 group-hover:fill-white" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => handleSocialLogin('oauth_apple')}
              className="flex justify-center items-center h-11 bg-white border border-slate-200 rounded-xl overflow-hidden relative group transform-gpu shadow-[0_4px_10px_-2px_rgba(0,0,0,0.1)]"
              style={{ transform: "translateY(-2px)" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.2, 
                delay: 0.8,
                y: {
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }
              }}
              whileHover={{ 
                y: -6,
                boxShadow: '0 20px 35px -7px rgba(0, 0, 0, 0.2)',
                transition: { 
                  duration: 0.3,
                  y: {
                    type: "spring",
                    stiffness: 500,
                    damping: 20
                  }
                }
              }}
              whileTap={{ 
                y: -3,
                boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.15)',
                transition: { duration: 0.1 }
              }}
            >
              <span className="absolute inset-0 w-0 bg-slate-900 transition-all duration-300 ease-out group-hover:w-full"></span>
              <svg className="w-5 h-5 relative z-10 transition-all duration-300 group-hover:fill-white" fill="#000000" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </motion.button>
          </div>

          {/* Sign Up Link */}
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.9 }}
          >
            <p className="text-[13px] text-slate-500 font-light tracking-wide">
              Don't have an account?{' '}
              <Link
                href="/sign-up" 
                className="text-[#183636] hover:text-[#1c4141] font-medium tracking-wide"
              >
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
        
        {/* Footer */}
        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <p className="text-[11px] text-slate-400 font-light tracking-wide">
            By signing in, you agree to our{' '}
            <motion.a 
              href="#" 
              className="text-slate-500 hover:text-indigo-600 transition-colors"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.1 }}
            >
              Terms
            </motion.a>
            {' '}and{' '}
            <motion.a 
              href="#" 
              className="text-slate-500 hover:text-indigo-600 transition-colors"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.1 }}
            >
              Privacy Policy
            </motion.a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}