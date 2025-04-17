'use client';

import Image from 'next/image';
import { useBranding } from '@/context/BrandingContext';
import { Heart, Users, Sparkles, Shield, GraduationCap, Award } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  photoPath: string;
}

export default function About() {
  const branding = useBranding();
  const aboutUs = branding.aboutUs || {};
  const team = aboutUs.team || [];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
              About {branding.brandName || 'Hamro Home Stay'}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Experience authentic Nepali hospitality through our carefully curated network of homestays.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 md:h-full min-h-[320px] rounded-2xl overflow-hidden shadow-md">
              <Image
                src={branding.sliderImages?.[0] || '/images/default-story.jpg'}
                alt="Our Story"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-6">Our Story</h2>
              <div className="prose prose-lg text-gray-600 max-w-none">
                <p className="mb-4">
                  {aboutUs.story || 
                    'Hamro Home Stay began with a vision to connect travelers with authentic Nepali culture and hospitality. We believe that the best way to experience a country is by living with its people.'}
                </p>
                <p>
                  What started as a small network of family homes in Kathmandu has grown into a thriving community of homestays across Nepal, each offering unique experiences while maintaining the warmth and authenticity of Nepali hospitality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-4">Our Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We operate based on core principles that guide our service and commitment to both hosts and guests.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-5">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-3">Authentic Experiences</h3>
              <p className="text-gray-600">
                We believe in immersive cultural exchanges that create meaningful connections between hosts and guests.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-5">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-3">Community Support</h3>
              <p className="text-gray-600">
                Our platform directly benefits local communities by creating sustainable income opportunities.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-5">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-3">Trust & Safety</h3>
              <p className="text-gray-600">
                Every homestay is carefully vetted to ensure comfort, cleanliness, and safety for all guests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      {team.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-2xl font-bold mb-4">Our Team</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Meet the dedicated people behind Hamro Home Stay who work tirelessly to create memorable experiences.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {team.map((member: TeamMember, index: number) => (
                <div key={index} className="text-center">
                  <div className="relative mx-auto w-40 h-40 rounded-full overflow-hidden mb-4 shadow-sm border-2 border-white">
                    <Image
                      src={member.photoPath || '/images/default-avatar.jpg'}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-medium">{member.name}</h3>
                  <p className="text-primary">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Achievements Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover what makes our homestay network stand out from the rest.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                  <Award className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Quality Assurance</h3>
                <p className="text-gray-600">
                  All homestays meet our strict quality standards for comfort and amenities.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Unique Experiences</h3>
                <p className="text-gray-600">
                  Each homestay offers something special, from cooking classes to guided local tours.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Cultural Learning</h3>
                <p className="text-gray-600">
                  Immerse yourself in local traditions, customs, and daily life with your host family.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl font-light mb-0">
            {aboutUs.mission || 
              "To connect travelers with authentic Nepali experiences while empowering local communities through sustainable tourism."}
          </p>
        </div>
      </section>
    </div>
  );
} 