'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useBranding } from '@/context/BrandingContext';
import { getImageUrl } from '@/lib/utils';

interface BrandedDashboardHeaderProps {
  adminUsername?: string;
}

export default function BrandedDashboardHeader({ adminUsername }: BrandedDashboardHeaderProps) {
  const branding = useBranding();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Set time-based greeting in Nepali
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('शुभ प्रभात');  // Good morning
    } else if (hour < 17) {
      setGreeting('शुभ दिन');     // Good day/afternoon
    } else {
      setGreeting('शुभ सन्ध्या');  // Good evening
    }
  }, []);

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="flex flex-col md:flex-row items-center py-6 px-8">
        {/* Brand Logo */}
        <div className="mb-4 md:mb-0 md:mr-6 flex-shrink-0">
          {branding.logoPath ? (
            <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden border-2 border-white shadow-md">
              <Image
                src={getImageUrl(branding.logoPath)}
                alt={branding.brandName || 'Brand Logo'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 64px, 80px"
              />
            </div>
          ) : (
            <div className="h-16 w-16 md:h-20 md:w-20 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl md:text-3xl shadow-md">
              {branding.brandName?.charAt(0) || 'H'}
            </div>
          )}
        </div>
        
        {/* Brand Text and Welcome Message */}
        <div className="text-center md:text-left">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
            {branding.brandName || 'हाम्रो होम स्टे'} व्यवस्थापन प्यानल
          </h1>
          <p className="text-gray-600">
            <span className="font-medium">{greeting},</span> {' '}
            आज {new Date().toLocaleDateString('ne-NP', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        {/* Quick Stats - Optional */}
        <div className="hidden lg:flex ml-auto space-x-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">होमस्टेहरू</p>
            <p className="text-xl font-semibold text-primary">5</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">बुकिङहरू</p>
            <p className="text-xl font-semibold text-primary">12</p>
          </div>
        </div>
      </div>
    </div>
  );
} 