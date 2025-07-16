'use client';

import { createContext, useContext, ReactNode } from 'react';

// Define the branding data structure
export interface TeamMember {
  name: string;
  role: string;
  photoPath: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  imagePath: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  location: string;
  avatarPath: string;
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
  featuredSection?: {
    features: FeatureItem[];
  };
  testimonials?: Testimonial[];
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
  featuredSection: {
    features: [
      { 
        icon: '🏠',
        title: 'Authentic Local Experience',
        description: 'Stay with local families and experience authentic Nepali hospitality and culture.',
        imagePath: '/images/features/feature-1.jpg'
      },
      {
        icon: '🍽️',
        title: 'Traditional Cuisine',
        description: 'Enjoy homemade Nepali dishes prepared with locally sourced organic ingredients.',
        imagePath: '/images/features/feature-2.jpg'
      },
      {
        icon: '🌿',
        title: 'Scenic Locations',
        description: 'Our home stays are situated in beautiful locations with stunning mountain views.',
        imagePath: '/images/features/feature-3.jpg'
      },
      {
        icon: '🧳',
        title: 'Personalized Service',
        description: 'Each home stay offers personalized service to make your stay comfortable and memorable.',
        imagePath: '/images/features/feature-4.jpg'
      }
    ],
  },
  testimonials: [
    {
      quote: 'Our stay at the Hamro Home Stay was incredible. The hospitality was unmatched, and we felt like part of the family.',
      author: 'Sarah Johnson',
      location: 'United States',
      avatarPath: '/images/testimonials/avatar-1.jpg'
    },
    {
      quote: 'The authentic food, the warm hospitality, and the cultural experience made our stay unforgettable.',
      author: 'James Wilson',
      location: 'United Kingdom',
      avatarPath: '/images/testimonials/avatar-2.jpg'
    },
    {
      quote: 'If you want to experience the real Nepal, this is the place. Our host family was amazing.',
      author: 'Emma Thompson',
      location: 'Australia',
      avatarPath: '/images/testimonials/avatar-3.jpg'
    },
    {
      quote: 'The perfect blend of comfort and authentic cultural experience. Waking up to mountain views every morning was magical!',
      author: 'David Chen',
      location: 'Canada',
      avatarPath: '/images/testimonials/avatar-4.jpg'
    }
  ],
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