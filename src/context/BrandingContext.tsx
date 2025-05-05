'use client';

import { createContext, useContext, ReactNode } from 'react';

// Define the branding data structure
export interface TeamMember {
  name: string;
  role: string;
  photoPath: string;
}

export interface BrandingData {
  brandName: string;
  brandDescription: string;
  logoPath: string;
  sliderImages: string[];
  contactInfo: {
    address: string;
    email: string;
    phone: string;
    socialLinks: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      tiktok?: string;
      youtube?: string;
    };
  };
  aboutUs: {
    story: string;
    mission: string;
    vision: string;
    team: TeamMember[];
  };
  _fetchedAt?: number; // Timestamp when the data was fetched
}

// Create context with default empty values
const BrandingContext = createContext<BrandingData>({
  brandName: '',
  brandDescription: '',
  logoPath: '',
  sliderImages: [],
  contactInfo: {
    address: '',
    email: '',
    phone: '',
    socialLinks: {},
  },
  aboutUs: {
    story: '',
    mission: '',
    vision: '',
    team: [],
  },
});

// Provider component
export function BrandingProvider({
  children,
  brandingData,
}: {
  children: ReactNode;
  brandingData: BrandingData;
}) {
  return (
    <BrandingContext.Provider value={brandingData}>
      {children}
    </BrandingContext.Provider>
  );
}

// Custom hook to use the branding data
export function useBranding() {
  return useContext(BrandingContext);
} 