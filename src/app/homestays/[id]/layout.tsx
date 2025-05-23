"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import { Home, Phone, Info, Menu, X, Map, Mail, Facebook, Instagram, Twitter, Youtube, Music } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';

// Helper function to construct image URLs without timestamps to avoid hydration mismatches
export function getApiImageUrl(imagePath: string | null | undefined): string {
  return getImageUrl(imagePath);
}

interface HomestayData {
  _id: string;
  homestayId: string;
  homeStayName: string;
  profileImage: string | null;
  status: string;
  contacts?: {
    _id: string;
    homestayId: string;
    name: string;
    mobile: string;
    email: string;
    facebook?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
  }[];
}

export default function HomestayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const homestayId = params.id as string;
  const [homestay, setHomestay] = useState<HomestayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    // Fetch homestay data for header/footer
    const fetchBasicData = async () => {
      try {
        setLoading(true);
        // Try to fetch from main API with explicit parameter to include contacts
        const response = await fetch(`/api/homestays/${homestayId}?include=contacts`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch homestay data');
        }
        
        const data = await response.json();
        console.log("API Response:", data); // Debug log to see what we're getting
        
        // Handle different response structures
        if (data.homestay) {
          // If contacts are in a separate array in the response, assign them to the homestay object
          if (data.contacts && Array.isArray(data.contacts)) {
            setHomestay({
              ...data.homestay,
              contacts: data.contacts
            });
          } else {
            setHomestay(data.homestay);
          }
        } else {
          // For backward compatibility if the response is directly the homestay
          if (data.contacts && Array.isArray(data.contacts)) {
            setHomestay({
              ...data,
              contacts: data.contacts
            });
          } else {
            setHomestay(data);
          }
        }
      } catch (err) {
        console.error('Error fetching homestay data:', err);
        
        // Only set static fallback data when API fails
        setHomestay({
          _id: "static-id",
          homestayId: homestayId,
          homeStayName: "Hamro Homestay",
          profileImage: "/images/homestay-profile.jpg",
          status: "approved",
          contacts: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBasicData();
  }, [homestayId]);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Get the primary contact info for footer
  const primaryContact = homestay?.contacts?.[0] || null;
  
  // Log contact info for debugging
  console.log("Primary Contact:", primaryContact);
  
  // Create fallback contact information if none exists
  const contactEmail = primaryContact?.email || "info@hamrohomestay.com";
  const contactPhone = primaryContact?.mobile || "+977 9800000000";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href={`/homestays/${homestayId}`} className="flex items-center">
                {homestay?.profileImage ? (
                  <div className="h-8 w-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                    <Image 
                      src={getApiImageUrl(homestay.profileImage)} 
                      alt={homestay.homeStayName}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full object-center"
                      unoptimized={true}
                    />
                  </div>
                ) : (
                  <div className="h-8 w-8 bg-primary rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold">
                    {homestay?.homeStayName?.charAt(0) || 'H'}
                  </div>
                )}
                <span className="text-primary font-medium truncate max-w-[200px]">
                  {loading ? 'Loading...' : homestay?.homeStayName || 'Hamro Homestay'}
                </span>
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link 
                href={`/homestays/${homestayId}`} 
                className={`text-sm flex items-center hover:text-primary transition-colors ${pathname === `/homestays/${homestayId}` ? 'text-primary font-medium' : 'text-gray-600'}`}
              >
                <Home className="h-4 w-4 mr-1" />
                Home
              </Link>
              <Link 
                href={`/homestays/${homestayId}/about`}
                className={`text-sm flex items-center hover:text-primary transition-colors ${pathname === `/homestays/${homestayId}/about` ? 'text-primary font-medium' : 'text-gray-600'}`}
              >
                <Info className="h-4 w-4 mr-1" />
                About
              </Link>
              <Link 
                href={`/homestays/${homestayId}/destinations`}
                className={`text-sm flex items-center hover:text-primary transition-colors ${pathname === `/homestays/${homestayId}/destinations` ? 'text-primary font-medium' : 'text-gray-600'}`}
              >
                <Map className="h-4 w-4 mr-1" />
                Destinations
              </Link>
              <Link 
                href={`/homestays/${homestayId}/contact`}
                className={`text-sm flex items-center hover:text-primary transition-colors ${pathname === `/homestays/${homestayId}/contact` ? 'text-primary font-medium' : 'text-gray-600'}`}
              >
                <Phone className="h-4 w-4 mr-1" />
                Contact
              </Link>
            </nav>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMobileMenu}
                className="text-gray-500 hover:text-primary transition-colors p-1"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-2">
            <div className="container mx-auto px-4 space-y-2">
              <Link 
                href={`/homestays/${homestayId}`}
                className={`block py-2 px-3 rounded-md ${pathname === `/homestays/${homestayId}` ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </div>
              </Link>
              <Link 
                href={`/homestays/${homestayId}/about`}
                className={`block py-2 px-3 rounded-md ${pathname === `/homestays/${homestayId}/about` ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  About
                </div>
              </Link>
              <Link 
                href={`/homestays/${homestayId}/destinations`}
                className={`block py-2 px-3 rounded-md ${pathname === `/homestays/${homestayId}/destinations` ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Map className="h-4 w-4 mr-2" />
                  Destinations
                </div>
              </Link>
              <Link 
                href={`/homestays/${homestayId}/contact`}
                className={`block py-2 px-3 rounded-md ${pathname === `/homestays/${homestayId}/contact` ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact
                </div>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center mb-3">
                {homestay?.profileImage ? (
                  <div className="h-8 w-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                    <Image 
                      src={getApiImageUrl(homestay.profileImage)} 
                      alt={homestay?.homeStayName || 'Hamro Homestay'}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full object-center"
                      unoptimized={true}
                    />
                  </div>
                ) : (
                  <div className="h-8 w-8 bg-primary rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold">
                    {homestay?.homeStayName?.charAt(0) || 'H'}
                  </div>
                )}
                <h3 className="text-base font-medium">
                  {homestay?.homeStayName || 'Hamro Homestay'}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                Experience authentic Nepali hospitality in our carefully curated homestay.
              </p>
            </div>
            
            <div>
              <h3 className="text-base font-medium mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href={`/homestays/${homestayId}`} 
                    className="text-gray-600 hover:text-primary text-sm flex items-center"
                  >
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full mr-2"></span>
                    Home
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/homestays/${homestayId}/about`}
                    className="text-gray-600 hover:text-primary text-sm flex items-center"
                  >
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full mr-2"></span>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/homestays/${homestayId}/destinations`}
                    className="text-gray-600 hover:text-primary text-sm flex items-center"
                  >
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full mr-2"></span>
                    Destinations
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/homestays/${homestayId}/contact`}
                    className="text-gray-600 hover:text-primary text-sm flex items-center"
                  >
                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full mr-2"></span>
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-base font-medium mb-3">Contact Us</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-primary/70" />
                  {contactEmail}
                </p>
                <p className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-primary/70" />
                  {contactPhone}
                </p>
                
                {/* Social Media Links */}
                {primaryContact && (
                  <div className="flex space-x-3 mt-3">
                    {primaryContact.facebook && (
                      <a 
                        href={primaryContact.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Facebook size={16} />
                      </a>
                    )}
                    
                    {primaryContact.instagram && (
                      <a 
                        href={primaryContact.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 hover:bg-pink-100 transition-colors"
                      >
                        <Instagram size={16} />
                      </a>
                    )}
                    
                    {primaryContact.twitter && (
                      <a 
                        href={primaryContact.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 hover:bg-blue-100 transition-colors"
                      >
                        <Twitter size={16} />
                      </a>
                    )}
                    
                    {primaryContact.youtube && (
                      <a 
                        href={primaryContact.youtube} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <Youtube size={16} />
                      </a>
                    )}
                    
                    {primaryContact.tiktok && (
                      <a 
                        href={primaryContact.tiktok} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-800 hover:bg-gray-100 transition-colors"
                      >
                        <Music size={16} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100 mt-6 pt-4 text-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} {homestay?.homeStayName || 'Hamro Homestay'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 