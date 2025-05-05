import { notFound } from "next/navigation";
import ImageSlider from "@/components/home/ImageSlider";
import FeaturedSection from "@/components/home/FeaturedSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CtaSection from "@/components/home/CtaSection";
import ScrollPopup from "@/components/ui/ScrollPopup";
import { User } from "@/lib/models";
import dbConnect from "@/lib/mongodb";

export const dynamic = 'force-dynamic';

// This function generates the metadata for the page
export async function generateMetadata({ params }: { params: { adminUsername: string } }) {
  const { adminUsername } = params;
  
  try {
    // Connect to the database
    await dbConnect();
    
    // Find the admin user
    const adminUser = await User.findOne({ 
      username: adminUsername,
      role: 'admin'
    });

    if (!adminUser) {
      return {
        title: "Not Found",
        description: "The requested admin portal was not found"
      };
    }

    return {
      title: `${adminUsername} - Hamro Home Stay | Authentic Nepali Hospitality`,
      description: `${adminUsername}'s portal for authentic Nepali culture and hospitality with carefully selected home stays.`
    };
  } catch (error) {
    console.error(`Error generating metadata for ${adminUsername}:`, error);
    return {
      title: "Error",
      description: "An error occurred while loading this page"
    };
  }
}

export default async function AdminHomePage({ params }: { params: { adminUsername: string } }) {
  const { adminUsername } = params;
  
  try {
    // Connect to the database
    await dbConnect();
    
    // Find the admin user
    const adminUser = await User.findOne({ 
      username: adminUsername,
      role: 'admin'
    });

    // If the admin doesn't exist, show a 404 page
    if (!adminUser) {
      notFound();
    }

    return (
      <div className="flex flex-col w-full">
        <ImageSlider />
        <FeaturedSection adminUsername={adminUsername} />
        <TestimonialsSection />
        <CtaSection adminUsername={adminUsername} />
        <ScrollPopup />
      </div>
    );
  } catch (error) {
    console.error(`Error in admin home page for ${adminUsername}:`, error);
    notFound();
  }
} 