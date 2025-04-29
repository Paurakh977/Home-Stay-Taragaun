"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Send, ChevronRight, Info, Youtube, Music } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Helper function to format image URLs
const formatImageUrl = (imagePath: string | undefined): string => {
  console.log("Original image path:", imagePath); // Debug log

  if (!imagePath || imagePath === "") {
    // Hardcoded fallback image
    console.log("Using fallback image: /images/destinations/kathmandu.jpg"); // Debug log
    return "/images/destinations/kathmandu.jpg";
  }

  // For images stored in the uploads directory, route through the API
  if (imagePath.startsWith('/uploads/')) {
    const apiImagePath = `/api/images${imagePath}`;
    console.log("Converted to API path:", apiImagePath); // Debug log
    return apiImagePath;
  }

  console.log("Using original path:", imagePath); // Debug log
  return imagePath;
};

interface Contact {
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
}

interface Official {
  _id: string;
  homestayId: string;
  name: string;
  role: string;
  contactNo: string;
  gender?: string;
}

interface HomestayData {
  _id: string;
  homestayId: string;
  homeStayName: string;
  description?: string;
  address: {
    province: { en: string; ne: string };
    district: { en: string; ne: string };
    municipality: { en: string; ne: string };
    ward: { en: string; ne: string };
    city: string;
    tole: string;
    formattedAddress: { en: string; ne: string };
  };
  directions?: string;
  localAttractions?: string[];
  tourismServices?: string[];
  infrastructure?: string[];
  features?: {
    localAttractions: string[];
    tourismServices: string[];
    infrastructure: string[];
  };
  status?: string;
  avgRating?: number;
  averageRating?: number;
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
  profileImage?: string;
  galleryImages?: string[];
  homeCount?: number;
  roomCount?: number;
  bedCount?: number;
  villageName?: string;
  homeStayType?: string;
  dhsrNo?: string;
  contacts?: Contact[];
  officials?: Official[];
  pageContent?: {
    contactPage?: {
      title?: string;
      subtitle?: string;
      backgroundImage?: string;
      formTitle?: string;
      mapEmbedUrl?: string;
      faq?: {
        question: string;
        answer: string;
      }[];
    };
  };
}

// Helper function to provide static data
function getStaticHomestayData(id: string): HomestayData {
  return {
    _id: "",
    homestayId: id,
    homeStayName: "",
    description: "",
    address: {
      province: { en: "", ne: "" },
      district: { en: "", ne: "" },
      municipality: { en: "", ne: "" },
      ward: { en: "", ne: "" },
      city: "",
      tole: "",
      formattedAddress: { 
        en: "",
        ne: ""
      }
    },
    directions: "",
    latitude: 0,
    longitude: 0,
    contacts: [],
    officials: [],
    status: "pending",
    avgRating: 0,
    profileImage: "/images/destinations/kathmandu.jpg" // Hardcoded fallback image
  };
}

export default function ContactPage() {
  const params = useParams();
  const homestayId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homestay, setHomestay] = useState<HomestayData | null>(null);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (!homestayId || Array.isArray(homestayId)) {
      console.error('Invalid homestay ID:', homestayId);
      setError('Invalid homestay ID');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/homestays/${homestayId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch homestay data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle different response structures
        if (data.homestay) {
          setHomestay(data.homestay);
          
          // Set officials and contacts if available
          if (data.officials && Array.isArray(data.officials)) {
            setOfficials(data.officials);
          } else if (data.homestay.officials && Array.isArray(data.homestay.officials)) {
            setOfficials(data.homestay.officials);
          }
          
          if (data.contacts && Array.isArray(data.contacts)) {
            setContacts(data.contacts);
          } else if (data.homestay.contacts && Array.isArray(data.homestay.contacts)) {
            setContacts(data.homestay.contacts);
          }
        } else {
          // For backward compatibility
          setHomestay(data);
          
          // Try to extract officials and contacts if they exist
          if (data.officials) {
            setOfficials(data.officials);
          }
          
          if (data.contacts) {
            setContacts(data.contacts);
          }
        }
      } catch (err) {
        console.error('Error fetching homestay data:', err);
        setError('Failed to load homestay data');
        
        // Use static data as fallback only if API fails
        setHomestay(getStaticHomestayData(homestayId));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [homestayId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    setFormError(null);
    
    try {
      // Validate form fields
      if (!name.trim() || !email.trim() || !message.trim()) {
        throw new Error('Please fill in all fields');
      }
      
      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Submit form data
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          message,
          homestayId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
      
      // Reset form on success
      setName('');
      setEmail('');
      setMessage('');
      setFormStatus('success');
      
      // Reset success status after 5 seconds
      setTimeout(() => {
        setFormStatus('idle');
      }, 5000);
    } catch (err: any) {
      console.error('Form submission error:', err);
      setFormError(err.message || 'An error occurred. Please try again.');
      setFormStatus('error');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!homestay) {
    return (
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Homestay Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "We couldn't find the homestay you're looking for."}</p>
          <Link href="/" className="inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <div className="mb-4 text-sm">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li>
                  <Link href="/" className="text-gray-500 hover:text-primary">Home</Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <Link href={`/homestays/${homestayId}`} className="ml-1 text-gray-500 hover:text-primary">
                      {homestay.homeStayName}
                    </Link>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="ml-1 text-gray-700 font-medium">Contact</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">{homestay.pageContent?.contactPage?.title || `Contact ${homestay.homeStayName}`}</h1>
          <p className="text-gray-600 mt-2">{homestay.pageContent?.contactPage?.subtitle || "Get in touch with us to plan your stay or ask any questions"}</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Contact Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Homestay Card */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div 
                  className="relative h-44 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: `url('${homestay.pageContent?.contactPage?.backgroundImage || "/images/destinations/kathmandu.jpg"}')`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="text-xl font-semibold text-white">{homestay.homeStayName}</h2>
                    <div className="flex items-center text-white/90 text-sm">
                      <MapPin size={14} className="mr-1" />
                      <p className="truncate">{homestay.address?.formattedAddress?.en || `${homestay.address?.tole || ''}, ${homestay.address?.city || ''}`}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  
                  {contacts && contacts.length > 0 ? (
                    <div className="space-y-6">
                      {contacts.map((contact, index) => (
                        <div key={index} className="space-y-3">
                          <h4 className="font-medium text-gray-800">{contact.name}</h4>
                          
                          <div className="flex items-start text-gray-700">
                            <Phone className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                            <a href={`tel:${contact.mobile}`} className="hover:text-primary">
                              {contact.mobile}
                            </a>
                          </div>
                          
                          {contact.email && (
                            <div className="flex items-start text-gray-700">
                              <Mail className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                              <a href={`mailto:${contact.email}`} className="hover:text-primary">
                                {contact.email}
                              </a>
                            </div>
                          )}
                          
                          <div className="flex items-center mt-4 space-x-4">
                            {contact.facebook && (
                              <a 
                                href={contact.facebook} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Facebook"
                              >
                                <Facebook size={18} />
                              </a>
                            )}
                            
                            {contact.instagram && (
                              <a 
                                href={contact.instagram} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 hover:bg-pink-100 transition-colors"
                                title="Instagram"
                              >
                                <Instagram size={18} />
                              </a>
                            )}
                            
                            {contact.twitter && (
                              <a 
                                href={contact.twitter} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-400 hover:bg-blue-100 transition-colors"
                                title="Twitter"
                              >
                                <Twitter size={18} />
                              </a>
                            )}
                            
                            {contact.youtube && (
                              <a 
                                href={contact.youtube} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors"
                                title="YouTube"
                              >
                                <Youtube size={18} />
                              </a>
                            )}
                            
                            {contact.tiktok && (
                              <a 
                                href={contact.tiktok} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-800 hover:bg-gray-100 transition-colors"
                                title="TikTok"
                              >
                                <Music size={18} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 italic">Contact information is not available at the moment.</p>
                  )}
                </div>
              </div>
              
              {/* Officials */}
              {officials && officials.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Homestay Officials</h3>
                  <div className="space-y-5">
                    {officials.map((official, index) => (
                      <div key={index} className="flex items-start">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                          {official.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{official.name}</div>
                          <div className="text-sm text-primary mb-1">{official.role}</div>
                          {official.contactNo && (
                            <div className="flex items-center text-gray-600 text-sm">
                              <Phone className="h-3.5 w-3.5 mr-1.5" />
                              <a href={`tel:${official.contactNo}`} className="hover:text-primary">
                                {official.contactNo}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Location Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <div className="flex items-start mb-4">
                  <MapPin className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-gray-800">
                      {homestay.address?.formattedAddress?.en || `${homestay.address?.tole || ''}, ${homestay.address?.city || ''}`}
                    </div>
                    {homestay.directions && (
                      <div className="mt-3 text-gray-600 text-sm border-t pt-3">{homestay.directions}</div>
                    )}
                  </div>
                </div>
                
                {homestay.latitude && homestay.longitude && (
                  <div className="h-64 rounded-lg overflow-hidden mt-3">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight={0} 
                      marginWidth={0} 
                      src={`https://maps.google.com/maps?q=${homestay.latitude},${homestay.longitude}&z=15&output=embed`} 
                      title="Homestay Location"
                    ></iframe>
                  </div>
                )}
                
                {homestay.latitude && homestay.longitude && (
                  <div className="mt-3">
                    <a 
                      href={`https://maps.google.com/maps?q=${homestay.latitude},${homestay.longitude}&z=15`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-lg text-primary hover:bg-gray-50 transition-colors"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Directions
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column - Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <h2 className="text-2xl font-semibold text-gray-900">{homestay.pageContent?.contactPage?.formTitle || "Send us a Message"}</h2>
                  <p className="text-gray-600 mt-1">Have a question or want to book a stay? Send us a message below.</p>
                </div>
                
                <div className="p-6">
                  {formStatus === 'success' && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start">
                      <div className="rounded-full bg-green-100 p-1 mt-0.5 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Message Sent Successfully!</p>
                        <p className="text-sm mt-1">Thank you for your message. We'll get back to you as soon as possible.</p>
                      </div>
                    </div>
                  )}
                  
                  {formStatus === 'error' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
                      <div className="rounded-full bg-red-100 p-1 mt-0.5 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Error</p>
                        <p className="text-sm mt-1">{formError || 'An error occurred. Please try again.'}</p>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                      <input
                        type="text"
                        id="name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                      <input
                        type="email"
                        id="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                      <textarea
                        id="message"
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us about your inquiry or booking request..."
                        required
                      ></textarea>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                      <Info className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700">
                        We typically respond to messages within 24 hours. For urgent inquiries, please contact the homestay directly by phone.
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      className={`w-full bg-primary text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center hover:bg-primary-dark transition-colors ${formStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''}`}
                      disabled={formStatus === 'submitting'}
                    >
                      {formStatus === 'submitting' ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
              
              {/* FAQ Section */}
              <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
                
                <div className="space-y-4">
                  {homestay.pageContent?.contactPage?.faq && homestay.pageContent.contactPage.faq.length > 0 ? (
                    // Use FAQs from database
                    homestay.pageContent.contactPage.faq.map((faqItem, index) => (
                      <div key={index}>
                        <h4 className="font-medium text-gray-900 mb-2">{faqItem.question}</h4>
                        <p className="text-gray-600">{faqItem.answer}</p>
                      </div>
                    ))
                  ) : (
                    // Default FAQs as fallback
                    <>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">What is the check-in and check-out time?</h4>
                        <p className="text-gray-600">Check-in is at 2:00 PM and check-out is at 12:00 PM. Early check-in or late check-out may be available upon request.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Do you offer airport pickup?</h4>
                        <p className="text-gray-600">Yes, we can arrange airport pickup for an additional fee. Please contact us at least 24 hours before your arrival.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">What payment methods do you accept?</h4>
                        <p className="text-gray-600">We accept cash (NPR), major credit cards, and mobile payment options like eSewa and Khalti.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Is Wi-Fi available?</h4>
                        <p className="text-gray-600">Yes, we provide complimentary Wi-Fi access throughout the homestay.</p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-6 text-center">
                  <Link 
                    href={`/homestays/${homestayId}`} 
                    className="text-primary hover:text-primary-dark font-medium flex items-center justify-center"
                  >
                    Learn more about our homestay
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 