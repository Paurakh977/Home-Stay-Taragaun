'use client';

import { ReactNode } from 'react';
import { BrandingProvider, BrandingData } from './BrandingContext';

export default function BrandingProviderClient({
  children,
  brandingData,
}: {
  children: ReactNode;
  brandingData: BrandingData;
}) {
  return (
    <BrandingProvider brandingData={brandingData}>
      {children}
    </BrandingProvider>
  );
} 