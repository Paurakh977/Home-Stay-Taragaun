'use client';

import Link from "next/link";
import Image from "next/image";
import { useBranding } from "@/context/BrandingContext";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

interface FooterProps {
  adminUsername?: string;
}

const Footer = ({ adminUsername }: FooterProps) => {
  const branding = useBranding();
  const baseHref = adminUsername ? `/${adminUsername}` : '';
  const socialLinks = branding.contactInfo?.socialLinks || {};

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              {branding.logoPath ? (
                <div className="relative h-10 w-10 rounded-full overflow-hidden mr-2">
                  <Image
                    src={branding.logoPath}
                    alt={branding.brandName || 'Logo'}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg mr-2">
                  {branding.brandName?.charAt(0) || 'H'}
                </div>
              )}
              <span className="text-xl font-bold">{branding.brandName || 'Hamro Home Stay'}</span>
            </div>
            <p className="text-gray-400 mb-4">
              {branding.brandDescription || 'Experience authentic Nepali hospitality through our network of carefully selected home stays.'}
            </p>
            <div className="flex space-x-4">
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Facebook className="h-6 w-6" />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Instagram className="h-6 w-6" />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Twitter className="h-6 w-6" />
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  <Youtube className="h-6 w-6" />
                </a>
              )}
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href={baseHref || '/'} className="text-gray-400 hover:text-white">Home</Link></li>
              <li><Link href={`${baseHref}/about`} className="text-gray-400 hover:text-white">About Us</Link></li>
              <li><Link href={`${baseHref}/homestays`} className="text-gray-400 hover:text-white">Our Home Stays</Link></li>
              <li><Link href={`${baseHref}/contact`} className="text-gray-400 hover:text-white">Contact Us</Link></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{branding.contactInfo?.address || 'Thamel, Kathmandu, Nepal'}</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{branding.contactInfo?.phone || '+977 1234567890'}</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{branding.contactInfo?.email || 'info@hamrohomestay.com'}</span>
              </li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-gray-400 mb-4">Subscribe to our newsletter for the latest updates and offers.</p>
            <form className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="Your email address"
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} {branding.brandName || 'Hamro Home Stay'}. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href={`${baseHref}/privacy`} className="hover:text-white">Privacy Policy</Link>
            <Link href={`${baseHref}/terms`} className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 