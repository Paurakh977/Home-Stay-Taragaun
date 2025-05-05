"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// This is a wrapper component for the detailed page content
export default function AdminHomestayDetail({ homestayId, adminUsername }: { 
  homestayId: string;
  adminUsername: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    console.log(`AdminHomestayDetail: Rendering for homestay ${homestayId} under admin ${adminUsername}`);
  }, [homestayId, adminUsername]);

  // We can't directly import the page component as it has server/client conflicts
  // Instead, we'll allow this component to be used as a container and the parent will
  // handle navigation to the actual detailed page
  
  return (
    <div className="p-6 max-w-full overflow-x-auto flex-1">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.push(`/admin/${adminUsername}/homestays`)}
          className="flex items-center text-gray-500 hover:text-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span className="ml-2">Back to homestays</span>
        </button>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Homestay Details</h1>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">ID: {homestayId}</span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <p className="text-center text-gray-500">
              The homestay details should appear here. Use this component as a wrapper for the main homestay detail page.
            </p>
            
            <div className="mt-4 text-center">
              <p>If you're seeing this message, the proper content hasn't been included.</p>
              <p className="text-sm text-gray-500">
                Admin: {adminUsername}, Homestay ID: {homestayId}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 