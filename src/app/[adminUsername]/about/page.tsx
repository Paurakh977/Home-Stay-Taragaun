'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useBranding } from '@/context/BrandingContext';

// Define TeamMember interface
interface TeamMember {
  name: string;
  role: string;
  photoPath?: string;
}

// This is a wrapper component that uses the main About component
// but keeps the adminUsername in the URL for consistent navigation with navbar
export default function AdminAboutPage() {
  const params = useParams();
  const branding = useBranding();
  const aboutUs = branding.aboutUs || {};

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Minimalist Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 z-0"></div>
        <div className="max-w-5xl mx-auto px-4 py-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-8 md:mb-0">
              <h1 className="text-3xl font-bold mb-2 text-gray-900">
                About Us
              </h1>
              <div className="w-16 h-1 bg-primary rounded mb-4"></div>
              <p className="text-gray-600 max-w-lg">
                {branding.brandDescription || 
                  'Connecting travelers with authentic homestay experiences in Nepal'}
              </p>
            </div>
            
            <div className="flex justify-center">
              {branding.logoPath ? (
                <div className="relative h-24 w-24 md:h-32 md:w-32">
                  <Image
                    src={branding.logoPath}
                    alt={branding.brandName || 'Brand Logo'}
                    fill
                    className="object-cover rounded-full shadow-md border-4 border-white"
                    sizes="(max-width: 768px) 96px, 128px"
                  />
                </div>
              ) : (
                <div className="h-24 w-24 md:h-32 md:w-32 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-bold text-3xl md:text-4xl shadow-md border-4 border-white">
                  {branding.brandName?.charAt(0) || 'H'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Sections */}
      <div className="max-w-5xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Our Story */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden transform transition-all hover:shadow-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <span className="text-primary font-bold">01</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Our Story</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {aboutUs.story || 
                  'Founded with a vision to showcase authentic Nepali hospitality, Hamro Home Stay connects travelers with local families throughout Nepal. What began as a small initiative has grown into a network of carefully selected homestays that maintain the warmth and authenticity of Nepali culture while providing comfortable accommodations for guests from around the world.'}
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden transform transition-all hover:shadow-md">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">By the Numbers</h2>
              
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-primary font-bold text-xl">25+</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Homestays</p>
                    <p className="text-xs text-gray-500">Across Nepal</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-primary font-bold text-xl">12</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Districts</p>
                    <p className="text-xs text-gray-500">Coverage area</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-primary font-bold text-xl">500+</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Happy Guests</p>
                    <p className="text-xs text-gray-500">From around the world</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden transform transition-all hover:shadow-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <span className="text-primary font-bold">02</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {aboutUs.mission || 
                  'To connect travelers with authentic Nepali experiences while empowering local communities through sustainable tourism practices that generate income and preserve cultural heritage.'}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden transform transition-all hover:shadow-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <span className="text-primary font-bold">03</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {aboutUs.vision || 
                  'To be the leading platform for cultural exchange through homestays in Nepal, creating lasting connections between travelers and local communities while setting the standard for responsible tourism.'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Team Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6 mb-12 transform transition-all hover:shadow-md">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <span className="text-primary font-bold">04</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Our Team</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {(aboutUs.team && aboutUs.team.length > 0 ? aboutUs.team : [
                { name: 'Ram Sharma', role: 'Founder', photoPath: '' },
                { name: 'Sita Thapa', role: 'Operations Manager', photoPath: '' },
                { name: 'Hari Karki', role: 'Community Liaison', photoPath: '' },
                { name: 'Maya Gurung', role: 'Guest Relations', photoPath: '' }
              ]).map((member, index) => (
                <div key={index} className="text-center group">
                  {member.photoPath ? (
                    <div className="relative mx-auto w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-white shadow-sm group-hover:shadow-md transition-all">
                      <Image
                        src={member.photoPath}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-3 border-2 border-white shadow-sm group-hover:shadow-md transition-all">
                      <span className="text-primary font-bold text-xl">{member.name.charAt(0)}</span>
                    </div>
                  )}
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-primary text-xs">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 