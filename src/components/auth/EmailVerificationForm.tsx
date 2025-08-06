'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface EmailVerificationFormProps {
  onSuccess?: () => void;
}

export default function EmailVerificationForm({ onSuccess }: EmailVerificationFormProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !verificationCode) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Attempt to verify the email
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });
      
      if (result.status === 'complete') {
        // Set the newly created session as active
        await setActive({ session: result.createdSessionId });
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          // Default redirect to the root route
          router.push('/');
        }
      } else {
        setError("Verification failed. Please try again.");
      }
    } catch (err) {
      console.error('Email verification error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during verification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl text-center font-semibold text-slate-800 mb-2">Verify your email</h2>
      <p className="text-sm text-center text-slate-500 mb-6">
        We've sent a verification code to your email.
        <br />Please enter it below to complete your registration.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Verification code"
            className="w-full pl-4 pr-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 border-slate-200 placeholder-slate-300 text-slate-700 font-light tracking-wide"
            style={{ fontSize: '14px' }}
            required
          />
        </div>

        {error && (
          <motion.p
            className="text-[11px] text-red-500 font-light tracking-wide"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={isLoading || !verificationCode}
          className="w-full bg-gradient-to-r from-[#183636] to-[#1c4141] text-white py-3 px-4 rounded-xl font-medium tracking-wider text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 relative overflow-hidden group transform-gpu shadow-lg"
          style={{
            boxShadow: '0 6px 16px rgba(24, 54, 54, 0.2), 0 3px 6px rgba(24, 54, 54, 0.12), 0 1px 3px rgba(24, 54, 54, 0.14), 0 0 0 1px rgba(24, 54, 54, 0.05)',
            transform: 'translateY(-2px)',
          }}
          whileHover={{
            y: -6,
            boxShadow: '0 18px 30px rgba(24, 54, 54, 0.25), 0 8px 12px rgba(24, 54, 54, 0.2), 0 1px 4px rgba(24, 54, 54, 0.15), 0 0 0 1px rgba(24, 54, 54, 0.1)',
            transition: {
              duration: 0.3,
              y: {
                type: 'spring',
                stiffness: 500,
                damping: 20,
              },
            },
          }}
          whileTap={{
            y: -1,
            boxShadow: '0 8px 15px rgba(24, 54, 54, 0.2), 0 3px 6px rgba(24, 54, 54, 0.12), 0 0 0 1px rgba(24, 54, 54, 0.05)',
            transition: { duration: 0.1 },
          }}
        >
          <span className="absolute inset-0 w-0 bg-gradient-to-r from-[#1c4141] to-[#183636] transition-all duration-300 ease-out group-hover:w-full"></span>
          <span className="relative">
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'Verify Email'
            )}
          </span>
        </motion.button>

        <div className="mt-4 text-center">
          <p className="text-[13px] text-slate-500 font-light tracking-wide">
            Didn't receive a code?{' '}
            <button
              type="button"
              onClick={async () => {
                if (!isLoaded) return;
                try {
                  await signUp.prepareEmailAddressVerification();
                  setError('A new code has been sent to your email.');
                } catch (err) {
                  setError('Failed to resend verification code.');
                }
              }}
              className="text-[#183636] hover:text-[#1c4141] font-medium tracking-wide"
            >
              Resend
            </button>
          </p>
        </div>
      </form>
    </motion.div>
  );
} 