import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { WebContent } from '@/lib/models';

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
    
    // Comprehensive default content structure
    const defaultContent = {
      adminUsername,
      siteInfo: {
        siteName: "Nepal StayLink",
        tagline: "Your Gateway to Authentic Homestays",
        logoPath: "/Logo.png",
        faviconPath: "/favicon.ico"
      },
      navigation: {
        links: [
          { name: "Home", path: "/", order: 1 },
          { name: "About", path: "/about", order: 2 },
          { name: "Explore Homestays", path: "/homestays", order: 3 },
          { name: "Contact", path: "/contact", order: 4 }
        ]
      },
      footer: {
        description: "The ultimate platform that connects travelers with authentic Nepali homestays. Experience Nepal like a local and create memories that last a lifetime.",
        quickLinks: [
          { name: "Home", path: "/", order: 1 },
          { name: "About Us", path: "/about", order: 2 },
          { name: "Explore Homestays", path: "/homestays", order: 3 },
          { name: "Contact Us", path: "/contact", order: 4 },
          { name: "List Your Property", path: "/register", order: 5 }
        ],
        hostLinks: [
          { name: "Register Your Homestay", path: "/register", order: 1 },
          { name: "Login to Dashboard", path: "/login", order: 2 },
          { name: "Host Resources", path: "/resources", order: 3 },
          { name: "Success Stories", path: "/success-stories", order: 4 },
          { name: "Host Support", path: "/support", order: 5 }
        ],
        contactInfo: {
          address: "Thamel, Kathmandu, Nepal",
          email: "info@nepalstaylink.com",
          phone: "+977 1234567890",
          workingHours: "Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed"
        },
        socialLinks: [
          { platform: "Facebook", url: "https://facebook.com", icon: "Facebook" },
          { platform: "Instagram", url: "https://instagram.com", icon: "Instagram" },
          { platform: "Twitter", url: "https://twitter.com", icon: "Twitter" }
        ],
        copyright: `© ${new Date().getFullYear()} Nepal StayLink. All rights reserved.`,
        policyLinks: [
          { name: "Privacy Policy", path: "/privacy-policy", order: 1 },
          { name: "Terms of Service", path: "/terms-of-service", order: 2 },
          { name: "Sitemap", path: "/sitemap", order: 3 }
        ]
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
            },
            {
              icon: "HomeIcon",
              title: "Connect with Hosts",
              description: "Reach out directly to homestay owners and plan your authentic experience.",
              linkText: "Learn More",
              linkUrl: "/contact"
            },
            {
              icon: "Star",
              title: "Experience Nepal",
              description: "Immerse yourself in Nepali culture, cuisine, and traditions with locals.",
              linkText: "Read Stories",
              linkUrl: "/testimonials"
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
            },
            {
              name: "Kathmandu Valley",
              imagePath: "/images/destinations/kathmandu.jpg",
              homestayCount: 47
            },
            {
              name: "Chitwan",
              imagePath: "/images/destinations/chitwan.jpg",
              homestayCount: 28
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
            },
            {
              icon: "Shield",
              title: "Your Own Dashboard",
              description: "Full control over your listings and bookings"
            },
            {
              icon: "Shield",
              title: "Global Visibility",
              description: "Reach travelers looking for authentic experiences"
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
      },
      aboutPage: {
        hero: {
          title: "About Us",
          subtitle: "Connecting travelers with authentic Nepali homestays while empowering local communities.",
          backgroundImage: "/images/about/nepal-story.jpg"
        },
        story: {
          title: "Our Story",
          content: "Nepal StayLink was born from a passion for authentic travel experiences and a desire to support Nepali communities. We recognized that traditional accommodations often failed to provide genuine cultural immersion, while many homestay owners lacked the resources to connect with global travelers. Founded in 2022, our platform has grown from a small collection of homestays around Kathmandu to a nationwide network spanning the foothills of the Himalayas to the jungles of Chitwan. Our mission remains unchanged: to create meaningful connections between travelers and locals while ensuring economic benefits flow directly to communities.",
          imagePath: "/images/about/nepal-story.jpg"
        },
        values: {
          title: "Our Values",
          subtitle: "These core principles guide everything we do at Nepal StayLink.",
          items: [
            {
              icon: "Heart",
              title: "Authentic Experiences",
              description: "We believe in facilitating genuine cultural exchanges and immersive experiences that create meaningful connections."
            },
            {
              icon: "Users",
              title: "Community Empowerment",
              description: "Our platform directly benefits local communities by creating sustainable income opportunities and promoting cultural preservation."
            },
            {
              icon: "Shield",
              title: "Trust & Safety",
              description: "Every homestay is verified to ensure quality, safety, and authenticity for both hosts and guests."
            }
          ]
        },
        team: {
          title: "Meet Our Team",
          subtitle: "The passionate individuals behind Nepal StayLink who work tirelessly to connect travelers with authentic Nepali experiences.",
          members: [
            {
              name: "Asha Tamang",
              position: "Founder & CEO",
              photoPath: "/images/team/team-1.jpg",
              order: 1
            },
            {
              name: "Rajesh Sharma",
              position: "Chief Technology Officer",
              photoPath: "/images/team/team-2.jpg",
              order: 2
            },
            {
              name: "Sunita Rai",
              position: "Head of Community",
              photoPath: "/images/team/team-3.jpg",
              order: 3
            },
            {
              name: "Deepak Gurung",
              position: "Marketing Director",
              photoPath: "/images/team/team-4.jpg",
              order: 4
            }
          ]
        },
        offerings: {
          title: "What We Offer",
          subtitle: "Discover what makes Nepal StayLink the premier platform for authentic homestay experiences.",
          features: [
            {
              icon: "Award",
              title: "Verified Homestays",
              description: "Every homestay in our network is personally verified to ensure quality and authenticity."
            },
            {
              icon: "Sparkles",
              title: "Unique Experiences",
              description: "From cooking classes to cultural ceremonies, our homestays offer experiences beyond just accommodation."
            },
            {
              icon: "GraduationCap",
              title: "Host Training",
              description: "We provide comprehensive training and resources for our homestay hosts to ensure excellent guest experiences."
            }
          ]
        },
        impact: {
          title: "Our Impact",
          content: "At Nepal StayLink, we're proud of the positive impact we've made on local communities and sustainable tourism in Nepal. Through our platform:",
          stats: [
            "Over 200 families have gained sustainable income through homestay hosting",
            "More than $500,000 has been directly invested in rural Nepali communities",
            "Cultural preservation initiatives in 15 villages have received support"
          ],
          imagePath: "/images/about/nepal-impact.jpg"
        },
        mission: {
          statement: "To connect travelers with authentic Nepali experiences while empowering local communities through sustainable tourism that preserves cultural heritage and creates economic opportunities."
        },
        cta: {
          title: "Join the Nepal StayLink Community",
          subtitle: "Whether you're a traveler seeking authentic experiences or a homeowner looking to share your culture, become part of our growing community.",
          primaryButton: {
            text: "Find Homestays",
            link: "/homestays"
          },
          secondaryButton: {
            text: "List Your Property",
            link: "/register"
          }
        }
      },
      contactPage: {
        hero: {
          title: "Contact Us",
          subtitle: "Have questions or feedback? We'd love to hear from you. Reach out to our team using the contact information below.",
          backgroundImage: "/images/contact/contact-map.jpg"
        },
        form: {
          title: "Send Us a Message",
          nameLabel: "Your Name *",
          emailLabel: "Your Email *",
          subjectLabel: "Subject *",
          messageLabel: "Your Message *",
          submitButtonText: "Send Message",
          subjects: [
            "General Inquiry",
            "Homestay Listing",
            "Booking Help",
            "Partnership Opportunity",
            "Technical Support",
            "Feedback"
          ]
        },
        info: {
          title: "Get In Touch",
          location: {
            title: "Our Location",
            address: "Thamel, Kathmandu 44600, Nepal"
          },
          email: {
            title: "Email Us",
            general: "info@nepalstaylink.com",
            support: "support@nepalstaylink.com"
          },
          phone: {
            title: "Call Us",
            office: "+977 1 4123456",
            support: "+977 1 4123457"
          },
          hours: {
            title: "Working Hours",
            schedule: "Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed"
          }
        },
        map: {
          imagePath: "/images/contact/nepal-map.jpg",
          markerText: "Nepal StayLink Headquarters"
        }
      },
      testimonials: [
        {
          name: "Sarah Johnson",
          location: "United States",
          quote: "My stay with a local family in Pokhara was the highlight of my Nepal trip. The cultural immersion and home-cooked meals were incredible!",
          photoPath: "/images/testimonials/sarah.jpg"
        },
        {
          name: "Ramesh Patel",
          location: "India",
          quote: "As a neighboring country visitor, I appreciated the authentic experience and warm hospitality of my homestay hosts in Kathmandu Valley.",
          photoPath: "/images/testimonials/ramesh.jpg"
        },
        {
          name: "Akiko Tanaka",
          location: "Japan",
          quote: "The community homestay in Chitwan gave me unique insights into Nepali village life. I even participated in a traditional cooking class!",
          photoPath: "/images/testimonials/akiko.jpg"
        }
      ]
    };
    
    // Create new content in database using lean method for better handling
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