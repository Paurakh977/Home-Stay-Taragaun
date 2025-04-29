"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, MapPin, ChevronRight, Calendar } from "lucide-react";
import { getApiImageUrl } from "../layout";

// Helper function to format image URLs
const formatImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) {
    return "/images/homestay-placeholder.jpg";
  }

  // For images stored in the uploads directory, route through the API
  if (imagePath.startsWith('/uploads/')) {
    return `/api/images${imagePath}`;
  }

  return imagePath;
};

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
}

// Certification badges - static for presentation
const certifications = [
  {
    name: "Sustainable Tourism",
    description: "Certified for environmentally responsible practices",
    icon: "🌱"
  },
  {
    name: "Cultural Heritage",
    description: "Preserving and promoting authentic local culture",
    icon: "🏺"
  },
  {
    name: "Eco-Friendly",
    description: "Using renewable resources and minimizing waste",
    icon: "♻️"
  }
];

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
    features: {
      localAttractions: [],
      tourismServices: [],
      infrastructure: []
    },
    status: "pending",
    averageRating: 0,
    reviewCount: 0
  };
}

export default function AboutPage() {
  const params = useParams();
  const homestayId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homestay, setHomestay] = useState<HomestayData | null>(null);

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
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle different response structures
        if (data.homestay) {
          setHomestay(data.homestay);
        } else {
          setHomestay(data);
        }
      } catch (err) {
        console.error('Error fetching homestay data:', err);
        setError('Failed to load homestay data');
        
        // Only use static data as fallback if we don't get data from the API
        setHomestay(getStaticHomestayData(homestayId));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [homestayId]);
  
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

  // Get combined feature data
  const localAttractions = homestay?.features?.localAttractions || homestay?.localAttractions || [];
  const tourismServices = homestay?.features?.tourismServices || homestay?.tourismServices || [];
  const infrastructure = homestay?.features?.infrastructure || homestay?.infrastructure || [];

  // Hardcoded team members data for presentation
  const teamMembers = [
    {
      name: "Aarav Sharma",
      role: "Host & Cultural Guide",
      bio: "Aarav has been hosting guests for over 10 years, sharing local traditions and stories with visitors from around the world.",
      image: "/images/team/team-1.jpg"
    },
    {
      name: "Priya Tamang",
      role: "Chef & Cooking Instructor",
      bio: "Priya specializes in traditional Nepali cuisine and leads our popular cooking workshops for guests.",
      image: "/images/team/team-2.jpg"
    },
    {
      name: "Ram Bahadur",
      role: "Trekking & Nature Guide",
      bio: "Ram knows every trail in the region and leads our nature excursions, pointing out local flora and fauna.",
      image: "/images/team/team-3.jpg"
    },
    {
      name: "Sita Gurung",
      role: "Cultural Performance Director",
      bio: "Sita organizes our traditional dance and music performances, showcasing authentic local culture.",
      image: "/images/team/team-4.jpg"
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section with hardcoded background image */}
      <div className="relative h-[40vh] bg-slate-900">
        <Image 
          src="/images/home/hero-bg.jpg"
          alt={`${homestay.homeStayName} view`}
          fill
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold text-white mb-3">{homestay.homeStayName}</h1>
            <div className="flex items-center text-white/90">
              <MapPin size={18} className="mr-2" />
              <p>{homestay.address?.formattedAddress?.en || `${homestay.address?.tole || ''}, ${homestay.address?.city || ''}`}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-8 text-sm">
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
                    <span className="ml-1 text-gray-700 font-medium">About</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          
          {/* About Section */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-2/3">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">About {homestay.homeStayName}</h2>
                
                <div className="prose max-w-none text-gray-700">
                  {homestay.description ? homestay.description.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  )) : (
                    <p className="mb-4 leading-relaxed">
                      Experience authentic Nepali hospitality in our carefully curated homestay. Immerse yourself in local culture, taste traditional cuisine, and create unforgettable memories with our host families.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="md:w-1/3">
                <div className="bg-primary/5 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">At a Glance</h3>
                  
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span>Homestay Type: {homestay.homeStayType === 'community' ? 'Community' : 'Private'}</span>
                    </li>
                    {homestay.homeCount && (
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span>{homestay.homeCount} {homestay.homeCount > 1 ? 'Homes' : 'Home'}</span>
                    </li>
                    )}
                    {homestay.roomCount && (
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span>{homestay.roomCount} {homestay.roomCount > 1 ? 'Rooms' : 'Room'}</span>
                    </li>
                    )}
                    {homestay.bedCount && (
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span>{homestay.bedCount} {homestay.bedCount > 1 ? 'Beds' : 'Bed'}</span>
                    </li>
                    )}
                    {homestay.dhsrNo && (
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                      <span>DHSR No: {homestay.dhsrNo}</span>
                    </li>
                    )}
                  </ul>
                  
                  <div className="mt-6">
                    <Link 
                      href={`/homestays/${homestayId}/contact`}
                      className="flex items-center justify-center w-full bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Your Stay
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Our Values Section */}
          {(homestay.description && homestay.description.trim() !== "") && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Values</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌿</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Sustainability</h3>
                <p className="text-gray-600">We are committed to sustainable tourism practices that preserve our environment and benefit the local community.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏺</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Authenticity</h3>
                <p className="text-gray-600">We provide genuine cultural experiences that reflect the true essence of our traditions and way of life.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Community</h3>
                <p className="text-gray-600">We believe in inclusive growth and ensure that tourism benefits all members of our community.</p>
              </div>
            </div>
          </div>
          )}
          
          {/* Features Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">What We Offer</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Infrastructure */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Facilities</h3>
                {infrastructure && infrastructure.length > 0 ? (
                  <ul className="space-y-2.5">
                    {infrastructure.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">Information about facilities is not available at the moment.</p>
                )}
              </div>
              
              {/* Tourism Services */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Services</h3>
                {tourismServices && tourismServices.length > 0 ? (
                  <ul className="space-y-2.5">
                    {tourismServices.map((service, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{service}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">Information about tourism services is not available at the moment.</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Our Team Section - Now enabled with hardcoded data */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Meet Our Team</h2>
            <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">Our dedicated team members are passionate about providing you with an authentic and memorable homestay experience.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative h-64">
                    <Image 
                      src={member.image} 
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-primary text-sm mb-3">{member.role}</p>
                    <p className="text-gray-600 text-sm">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Certifications */}
          {false && ( /* Disabled unless explicit certification data exists */
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Certifications</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {certifications.map((cert, index) => (
                <div key={index} className="flex items-center p-5 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary transition-colors">
                  <div className="text-4xl mr-4">{cert.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                    <p className="text-sm text-gray-600">{cert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
          
          {/* CTA */}
          <div className="bg-primary/5 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Experience {homestay.homeStayName}?</h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">Book your stay today and immerse yourself in authentic local culture, traditions, and breathtaking natural beauty.</p>
            
            <div className="flex justify-center gap-4 flex-wrap">
              <Link 
                href={`/homestays/${homestayId}/contact`} 
                className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
              >
                Contact Us
              </Link>
              
              <Link
                href={`/homestays/${homestayId}`}
                className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 