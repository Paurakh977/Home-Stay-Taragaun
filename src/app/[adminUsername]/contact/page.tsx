'use client';

import { useParams } from 'next/navigation';
import { useBranding } from '@/context/BrandingContext';
import { 
  Loader2, 
  MapPin, 
  Mail, 
  Phone, 
  Send,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// Custom TikTok icon
const TiktokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

// This is a wrapper component that uses the main Contact component
// but keeps the adminUsername in the URL for consistent navigation with navbar
export default function AdminContactPage() {
  const params = useParams();
  const branding = useBranding();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const socialLinks = branding.contactInfo?.socialLinks || {};
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setName('');
      setEmail('');
      setMessage('');
      
      toast.success('Message sent successfully!');
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section with subtle gradient background */}
      <div className="relative overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 z-0"></div>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Get in Touch</h1>
          <div className="w-16 h-1 bg-primary rounded mx-auto mb-4"></div>
          <p className="text-gray-600 max-w-lg mx-auto">
            We'd love to hear from you. Reach out with any questions about our homestays or services.
          </p>
        </div>
      </div>
      
      {/* Main Content with Card Design */}
      <div className="max-w-5xl mx-auto px-4 -mt-4 pb-16">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Contact Info Column */}
            <div className="bg-gray-50 p-8 md:w-1/3">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Contact Information</h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-4 flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm mb-1">Address</p>
                    <p className="text-gray-600 text-sm">
                      {branding.contactInfo?.address || '123 Thamel Street, Kathmandu, Nepal'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-4 flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm mb-1">Email</p>
                    <a 
                      href={`mailto:${branding.contactInfo?.email || 'info@hamrohomestay.com'}`} 
                      className="text-gray-600 hover:text-primary transition-colors text-sm"
                    >
                      {branding.contactInfo?.email || 'info@hamrohomestay.com'}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-4 flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm mb-1">Phone</p>
                    <a 
                      href={`tel:${branding.contactInfo?.phone || '+9771234567890'}`} 
                      className="text-gray-600 hover:text-primary transition-colors text-sm"
                    >
                      {branding.contactInfo?.phone || '+977 1234567890'}
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Social Links */}
              <div>
                <p className="font-medium text-gray-900 text-sm mb-4">Connect with us</p>
                <div className="flex space-x-3">
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" 
                       className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                      <Facebook className="h-4.5 w-4.5" />
                    </a>
                  )}
                  
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" 
                       className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                      <Instagram className="h-4.5 w-4.5" />
                    </a>
                  )}
                  
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" 
                       className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                      <Twitter className="h-4.5 w-4.5" />
                    </a>
                  )}
                  
                  {socialLinks.tiktok && (
                    <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" 
                       className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                      <TiktokIcon className="h-4.5 w-4.5" />
                    </a>
                  )}
                  
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" 
                       className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                      <Youtube className="h-4.5 w-4.5" />
                    </a>
                  )}
                  
                  {/* Static social links if none provided */}
                  {!socialLinks.facebook && !socialLinks.instagram && !socialLinks.twitter && !socialLinks.tiktok && !socialLinks.youtube && (
                    <>
                      <a href="#" className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                        <Facebook className="h-4.5 w-4.5" />
                      </a>
                      <a href="#" className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                        <Instagram className="h-4.5 w-4.5" />
                      </a>
                      <a href="#" className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                        <Twitter className="h-4.5 w-4.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Form Column */}
            <div className="p-8 md:w-2/3">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Send a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Your name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Email address"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Your message"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-lg px-6 py-3 text-sm font-medium transition-colors w-full md:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
                
                <p className="text-sm text-gray-500 mt-4">
                  We typically respond within 24 hours
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 