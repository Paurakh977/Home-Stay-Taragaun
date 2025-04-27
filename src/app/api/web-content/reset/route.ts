import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { WebContent } from '@/lib/models';
import WebContentService from '@/lib/services/webContentService';

// POST handler for programmatic API access
export async function POST(req: NextRequest) {
  return resetContent(req);
}

// GET handler for easy browser access
export async function GET(req: NextRequest) {
  return resetContent(req);
}

// Shared reset function
async function resetContent(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get the admin username from query parameters
    const url = new URL(req.url);
    const adminUsername = url.searchParams.get('adminUsername') || 'main';
    
    // Delete existing content for this admin
    await WebContent.deleteOne({ adminUsername });
    
    // Create default content structure based on the model
    const defaultContent = {
      adminUsername,
      siteInfo: {
        siteName: "Nepal StayLink",
        tagline: "Your Gateway to Authentic Homestays",
        logoPath: "/Logo.png",
        faviconPath: "/favicon.ico"
      },
      homePage: {
        hero: {
          title: "Experience Authentic Nepal",
          subtitle: "Connect with local homestays and immerse yourself in Nepal's rich culture and hospitality.",
          backgroundImage: "/images/home/hero-bg.jpg",
          searchPlaceholder: "Where would you like to stay?"
        },
        stats: [
          { value: "200+", label: "Homestays" },
          { value: "50+", label: "Destinations" },
          { value: "5000+", label: "Travelers" }
        ],
        howItWorks: {
          title: "How It Works",
          subtitle: "A simple process to connect you with authentic Nepali homestays",
          steps: [
            {
              icon: "Search",
              title: "Find Your Stay",
              description: "Browse our curated selection of authentic Nepali homestays across the country.",
              linkText: "Explore Homestays",
              linkUrl: "/homestays"
            }
          ]
        },
        destinations: {
          title: "Popular Destinations",
          subtitle: "Discover our most sought-after homestay locations",
          items: [
            {
              name: "Pokhara",
              imagePath: "/images/destinations/pokhara.jpg",
              homestayCount: 32
            }
          ],
          viewAllLink: "/homestays"
        },
        join: {
          title: "Join Our Network of Homestays",
          description: "Connect with travelers from around the world seeking authentic Nepali experiences.",
          features: [
            {
              icon: "Shield",
              title: "Free Registration",
              description: "Easy setup process with no upfront costs"
            }
          ],
          backgroundImage: "/images/home/homestay-owner.jpg"
        },
        cta: {
          title: "Ready to Experience Authentic Nepal?",
          subtitle: "Start your journey today and discover the warmth of Nepali hospitality",
          backgroundImage: "/images/home/hero-bg.jpg",
          primaryButton: {
            text: "Find Homestays",
            link: "/homestays"
          },
          secondaryButton: {
            text: "List Your Property",
            link: "/register"
          }
        }
      }
    };
    
    // Create new content in database
    const newContent = await WebContent.create(defaultContent);
    
    return NextResponse.json({ 
      message: `Content for '${adminUsername}' reset successfully`,
      content: newContent
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error resetting web content:', error);
    return NextResponse.json(
      { error: 'Failed to reset web content', details: error.message },
      { status: 500 }
    );
  }
} 