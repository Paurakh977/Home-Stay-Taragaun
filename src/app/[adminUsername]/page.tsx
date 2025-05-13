import { notFound } from "next/navigation";
import ImageSlider from "@/components/home/ImageSlider";
import FeaturedSection from "@/components/home/FeaturedSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CtaSection from "@/components/home/CtaSection";
import ScrollPopup from "@/components/ui/ScrollPopup";
import { User } from "@/lib/models";
import dbConnect from "@/lib/mongodb";
import Link from "next/link";

// Configure the page to use dynamic rendering
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

    // TEMPORARY: Changed metadata for unavailable page
    return {
      title: "Page Unavailable",
      description: "This page is temporarily unavailable"
    };
    
    // ORIGINAL METADATA (commented out temporarily)
    /*
    return {
      title: `${adminUsername} - Hamro Home Stay | Authentic Nepali Hospitality`,
      description: `${adminUsername}'s portal for authentic Nepali culture and hospitality with carefully selected home stays.`
    };
    */
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

    // TEMPORARY: Return the page unavailable message with full-page styling
    // This completely minimizes the page and hides everything else
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          zIndex: 9999, // Very high z-index to cover everything
        }}
      >
        <Link 
          href="/homestays" 
          style={{
            padding: '12px 24px',
            backgroundColor: '#4F46E5', // Indigo color
            color: 'white',
            borderRadius: '8px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Explore Homestays
        </Link>
      </div>
    );
    
    // ORIGINAL CONTENT (commented out temporarily)
    /*
    return (
      <div className="flex flex-col w-full">
        <ImageSlider />
        <FeaturedSection adminUsername={adminUsername} />
        <TestimonialsSection />
        <CtaSection adminUsername={adminUsername} />
        <ScrollPopup />
      </div>
    );
    */
  } catch (error) {
    console.error(`Error in admin home page for ${adminUsername}:`, error);
    notFound();
  }
} 