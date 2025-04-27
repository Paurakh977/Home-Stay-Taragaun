'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, Star, Home as HomeIcon, Users, Shield, MapPin } from "lucide-react";
import { useWebContent } from "@/context/WebContentContext";

// Helper function to get the correct icon component
const getIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    Search: <Search className="h-7 w-7" />,
    HomeIcon: <HomeIcon className="h-7 w-7" />,
    Star: <Star className="h-7 w-7" />,
    Users: <Users className="h-7 w-7" />,
    Shield: <Shield className="h-7 w-7" />
  };
  
  return iconMap[iconName] || <Shield className="h-7 w-7" />;
};

// Define interfaces for the content data structure
interface IImpactStat {
  value: string;
  label: string;
}

interface IStep {
  icon: string;
  title: string;
  description: string;
  linkText: string;
  linkUrl: string;
}

interface IDestination {
  name: string;
  imagePath: string;
  homestayCount: number;
}

interface IFeature {
  icon: string;
  title: string;
  description: string;
}

export default function Home() {
  const { content, loading } = useWebContent();
  
  // Use default content if still loading or content not available
  const homeContent = loading || !content?.homePage
    ? {
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
          description: "Connect with travelers from around the world seeking authentic Nepali experiences. Showcase your homestay, increase your income, and share your culture with guests.",
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
      }
    : content.homePage;

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={homeContent.hero.backgroundImage}
            alt="Beautiful Himalayan view with traditional Nepali homestay"
            fill
            priority
            className="object-cover brightness-[0.7]"
          />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight tracking-tight">
            {homeContent.hero.title.split(' ').map((word: string, i: number, arr: string[]) => 
              i === arr.length - 1 ? 
                <span key={i} className="text-white/80">{word}</span> : 
                <span key={i}>{word} </span>
            )}
          </h1>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto font-light">
            {homeContent.hero.subtitle}
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto backdrop-blur-lg bg-black/20 p-2 rounded-xl border border-white/10 shadow-lg">
            <div className="flex items-center bg-white rounded-lg overflow-hidden">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={homeContent.hero.searchPlaceholder}
                  className="w-full py-4 px-12 border-0 focus:ring-0 text-gray-800 text-base"
                />
              </div>
              <button className="bg-gray-900 hover:bg-black text-white px-6 py-4 font-medium transition-all flex items-center m-1 rounded-lg">
                <Search className="mr-2 h-4 w-4" />
                <span>Find Stays</span>
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-16 flex flex-wrap justify-center gap-12">
            {homeContent.stats.map((stat: IImpactStat, index: number) => (
              <div key={index} className="backdrop-blur-md py-3 px-6">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/80 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{homeContent.howItWorks.title}</h2>
            <div className="w-16 h-1 bg-gray-200 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {homeContent.howItWorks.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {homeContent.howItWorks.steps.map((step: IStep, index: number) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-700 transition-all group-hover:bg-gray-900 group-hover:text-white">
                  {getIcon(step.icon)}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 mb-5">
                  {step.description}
                </p>
                <Link href={step.linkUrl} className="text-gray-800 font-medium inline-flex items-center group">
                  <span className="border-b border-gray-800 pb-1">{step.linkText}</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Destinations */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{homeContent.destinations.title}</h2>
            <div className="w-16 h-1 bg-gray-200 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {homeContent.destinations.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {homeContent.destinations.items.map((destination: IDestination, index: number) => (
              <div key={index} className="group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100">
                <div className="relative h-72 w-full">
                  <Image
                    src={destination.imagePath}
                    alt={destination.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 text-white">
                    <h3 className="text-2xl font-bold">{destination.name}</h3>
                    <p className="text-sm text-white/80 flex items-center mt-1">
                      <HomeIcon className="h-4 w-4 mr-1 opacity-70" />
                      {destination.homestayCount} homestays
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href={homeContent.destinations.viewAllLink}>
              <button className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-lg font-medium transition-all inline-flex items-center shadow-sm">
                View All Destinations
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* For Homestay Owners */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">{homeContent.join.title}</h2>
              <div className="w-16 h-1 bg-gray-700 mb-8"></div>
              <p className="text-lg mb-10 text-gray-300 leading-relaxed">
                {homeContent.join.description}
              </p>
              
              <div className="space-y-6 mb-10">
                {homeContent.join.features.map((feature: IFeature, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-gray-800 rounded-full p-2 mr-4 mt-1">
                      {getIcon(feature.icon)}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg text-white">{feature.title}</h3>
                      <p className="text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link href="/register">
                <button className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center">
                  Register Your Homestay
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Link>
            </div>
            
            <div className="relative h-96 lg:h-[600px] rounded-2xl overflow-hidden shadow-md">
              <Image
                src={homeContent.join.backgroundImage}
                alt="Homestay owner welcoming guests"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image 
            src={homeContent.cta.backgroundImage}
            alt="Nepal background"
            fill
            className="object-cover"
          />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-6">{homeContent.cta.title}</h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light">
            {homeContent.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href={homeContent.cta.primaryButton.link}>
              <button className="bg-white text-gray-900 hover:bg-gray-100 px-10 py-4 rounded-lg font-medium transition-all shadow-md">
                {homeContent.cta.primaryButton.text}
              </button>
            </Link>
            <Link href={homeContent.cta.secondaryButton.link}>
              <button className="bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 px-10 py-4 rounded-lg font-medium transition-all">
                {homeContent.cta.secondaryButton.text}
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}