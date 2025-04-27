'use client';

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { useWebContent } from "@/context/WebContentContext";

const PlatformFooter = () => {
  const { content, loading } = useWebContent();
  
  // Get footer data from content or use default
  const footerData = loading || !content?.footer
    ? {
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
      }
    : content.footer;
  
  // Get site info
  const siteInfo = loading || !content?.siteInfo
    ? {
        siteName: "Nepal StayLink",
        logoPath: "/Logo.png"
      }
    : content.siteInfo;
  
  // Sort links by order
  const quickLinks = footerData.quickLinks.sort((a: any, b: any) => a.order - b.order);
  const hostLinks = footerData.hostLinks.sort((a: any, b: any) => a.order - b.order);
  const policyLinks = footerData.policyLinks.sort((a: any, b: any) => a.order - b.order);
  
  // Helper function to render social icons
  const renderSocialIcon = (icon: string) => {
    switch(icon) {
      case 'Facebook':
        return <Facebook size={20} />;
      case 'Instagram':
        return <Instagram size={20} />;
      case 'Twitter':
        return <Twitter size={20} />;
      default:
        return <Facebook size={20} />;
    }
  };
  
  return (
    <footer className="bg-gray-100 text-gray-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Column 1: Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="relative h-12 w-12 mr-3 overflow-hidden rounded-full bg-white shadow-sm">
                <Image 
                  src={siteInfo.logoPath} 
                  alt={siteInfo.siteName} 
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold">{siteInfo.siteName}</span>
            </div>
            <p className="text-gray-600 text-sm mt-2">
              {footerData.description}
            </p>
            <div className="flex space-x-4 mt-4">
              {footerData.socialLinks.map((social: any, index: number) => (
                <a 
                  key={index}
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-500 hover:text-gray-800 transition-colors"
                >
                  {renderSocialIcon(social.icon)}
                </a>
              ))}
            </div>
          </div>
          
          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link: any, index: number) => (
                <li key={index}>
                  <Link href={link.path} className="text-gray-600 hover:text-gray-900 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Column 3: For Hosts */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900">For Homestay Owners</h3>
            <ul className="space-y-2">
              {hostLinks.map((link: any, index: number) => (
                <li key={index}>
                  <Link href={link.path} className="text-gray-600 hover:text-gray-900 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Column 4: Contact Info */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">
                  {footerData.contactInfo.address}
                </span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">
                  {footerData.contactInfo.phone}
                </span>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">
                  {footerData.contactInfo.email}
                </span>
              </li>
            </ul>
            
            {/* Newsletter Signup */}
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Subscribe to our newsletter</h4>
              <div className="flex mt-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-3 py-2 bg-white text-gray-800 placeholder-gray-500 rounded-l-md focus:outline-none focus:ring-1 focus:ring-gray-900 border border-gray-300 text-sm w-full"
                />
                <button className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-r-md transition-colors text-sm font-medium">
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="bg-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600">
            {footerData.copyright}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {policyLinks.map((link: any, index: number) => (
              <Link 
                key={index}
                href={link.path} 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PlatformFooter; 