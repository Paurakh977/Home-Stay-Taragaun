'use client';

import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccessDeniedPage() {
  const router = useRouter();
  
  const goBack = () => {
    router.back();
  };
  
  const goToDashboard = () => {
    router.push('/dashboard');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Access Denied</h1>
          
          <p className="text-center text-gray-600 mb-6">
            You don't have permission to access this feature. Please contact your administrator for assistance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              className="flex items-center justify-center"
              onClick={goBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            
            <Button
              variant="default"
              className="flex items-center justify-center"
              onClick={goToDashboard}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 