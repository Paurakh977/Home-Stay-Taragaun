'use client';

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/context/BrandingContext";

interface FeaturedSectionProps {
  adminUsername?: string;
}

// Default features as fallback if no data from context
const defaultFeatures = [
  {
    icon: "🏠",
    title: "Authentic Local Experience",
    description: "Stay with local families and experience authentic Nepali hospitality and culture.",
    imagePath: "/images/features/feature-1.jpg"
  },
  {
    icon: "🍽️",
    title: "Traditional Cuisine",
    description: "Enjoy homemade Nepali dishes prepared with locally sourced organic ingredients.",
    imagePath: "/images/features/feature-2.jpg"
  },
  {
    icon: "🌿",
    title: "Scenic Locations",
    description: "Our home stays are situated in beautiful locations with stunning mountain views.",
    imagePath: "/images/features/feature-3.jpg"
  },
  {
    icon: "🧳",
    title: "Personalized Service",
    description: "Each home stay offers personalized service to make your stay comfortable and memorable.",
    imagePath: "/images/features/feature-4.jpg"
  }
];

const FeaturedSection = ({ adminUsername }: FeaturedSectionProps) => {
  // Get branding data from context
  const branding = useBranding();
  
  // Use features from branding if available, otherwise use defaults
  const features = branding?.featuredSection?.features?.length ? 
    branding.featuredSection.features : 
    defaultFeatures;
  
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Why Choose Our Home Stays</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the warmth and authenticity of Nepali culture through our carefully selected home stays
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="relative h-48 w-full">
                <Image
                  src={feature.imagePath || `/images/features/feature-${index+1}.jpg`}
                  alt={feature.title || `Feature ${index+1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span className="text-2xl">{feature.icon || '🏠'}</span> {feature.title || `Feature ${index+1}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  {feature.description || 'Experience the best of Nepali hospitality with our carefully selected home stays.'}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link href={adminUsername ? `/${adminUsername}/homestays` : "/homestays"}>
            <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6" size="lg">
              View All Home Stays
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection; 