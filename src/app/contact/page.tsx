'use client';

import { useState } from 'react';
import { 
  Loader2, 
  MapPin, 
  Mail, 
  Phone, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { useBranding } from '@/context/BrandingContext';

// Custom TikTok icon since Lucide doesn't have one
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

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const branding = useBranding();
  const socialLinks = branding.contactInfo?.socialLinks || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would send this data to your API
      // For now, we'll simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setName('');
      setEmail('');
      setMessage('');
      
      toast.success('Message sent successfully!');
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
      <div className="max-w-2xl mx-auto mb-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">Get in Touch</h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Have questions about our homestays? We'd love to hear from you.
        </p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Contact Form - Takes up more space */}
          <div className="p-8 md:p-10 md:col-span-3">
            <h2 className="text-xl font-medium mb-6">Send us a message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="John Doe"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="john@example.com"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="How can we help you?"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
          
          {/* Contact Information */}
          <div className="bg-gray-50 p-8 md:p-10 md:col-span-2">
            <h2 className="text-xl font-medium mb-6">Contact Information</h2>
            
            <div className="space-y-7">
              <div className="flex items-start">
                <MapPin className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Our Address</h3>
                  <p className="text-gray-600">
                    {branding.contactInfo?.address || 'Thamel, Kathmandu, Nepal'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Mail className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Email Us</h3>
                  <a 
                    href={`mailto:${branding.contactInfo?.email || 'info@hamrohomestay.com'}`} 
                    className="text-gray-600 hover:text-primary transition-colors"
                  >
                    {branding.contactInfo?.email || 'info@hamrohomestay.com'}
                  </a>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Call Us</h3>
                  <a 
                    href={`tel:${branding.contactInfo?.phone || '+9771234567890'}`} 
                    className="text-gray-600 hover:text-primary transition-colors"
                  >
                    {branding.contactInfo?.phone || '+977 1234567890'}
                  </a>
                </div>
              </div>
              
              {/* Social Media Links */}
              {(socialLinks.facebook || socialLinks.instagram || socialLinks.twitter || socialLinks.tiktok || socialLinks.youtube) && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Connect With Us</h3>
                  <div className="flex space-x-4">
                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    
                    {socialLinks.twitter && (
                      <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    
                    {socialLinks.tiktok && (
                      <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                        <TiktokIcon className="h-5 w-5" />
                      </a>
                    )}
                    
                    {socialLinks.youtube && (
                      <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="bg-white p-2.5 rounded-full shadow-sm text-gray-600 hover:text-primary hover:shadow-md transition-all">
                        <Youtube className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 