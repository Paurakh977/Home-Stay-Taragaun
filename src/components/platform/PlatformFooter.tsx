'use client';

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

const PlatformFooter = () => {
  const currentYear = new Date().getFullYear();
  
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
                  src="/Logo.png" 
                  alt="Nepal StayLink" 
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold">Nepal StayLink</span>
            </div>
            <p className="text-gray-600 text-sm mt-2">
              The ultimate platform that connects travelers with authentic Nepali homestays.
              Experience Nepal like a local and create memories that last a lifetime.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-800 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-800 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-800 transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/homestays" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Explore Homestays
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-600 hover:text-gray-900 transition-colors">
                  List Your Property
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: For Hosts */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900">For Homestay Owners</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/register" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Register Your Homestay
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Login to Dashboard
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Host Resources
                </Link>
              </li>
              <li>
                <Link href="/success-stories" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Success Stories
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Host Support
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Contact Info */}
          <div>
            <h3 className="text-lg font-medium mb-4 text-gray-900">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">
                  Thamel, Kathmandu, Nepal
                </span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">
                  +977 1234567890
                </span>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">
                  info@nepalstaylink.com
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
            © {currentYear} Nepal StayLink. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy-policy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/sitemap" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PlatformFooter; 