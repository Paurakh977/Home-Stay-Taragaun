import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, Star, Home as HomeIcon, Users, Shield, MapPin } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/home/hero-bg.jpg"
            alt="Beautiful Himalayan view with traditional Nepali homestay"
            fill
            priority
            className="object-cover brightness-[0.7]"
          />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight tracking-tight">
            Experience Authentic <span className="text-white/80">Nepal</span>
          </h1>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto font-light">
            Connect with local homestays and immerse yourself in Nepal's rich culture and hospitality.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto backdrop-blur-lg bg-black/20 p-2 rounded-xl border border-white/10 shadow-lg">
            <div className="flex items-center bg-white rounded-lg overflow-hidden">
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Where would you like to stay?" 
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
            <div className="backdrop-blur-md py-3 px-6">
              <p className="text-3xl font-bold text-white">200+</p>
              <p className="text-sm text-white/80 uppercase tracking-wider">Homestays</p>
            </div>
            <div className="backdrop-blur-md py-3 px-6">
              <p className="text-3xl font-bold text-white">50+</p>
              <p className="text-sm text-white/80 uppercase tracking-wider">Destinations</p>
            </div>
            <div className="backdrop-blur-md py-3 px-6">
              <p className="text-3xl font-bold text-white">5000+</p>
              <p className="text-sm text-white/80 uppercase tracking-wider">Travelers</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <div className="w-16 h-1 bg-gray-200 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A simple process to connect you with authentic Nepali homestays
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-700 transition-all group-hover:bg-gray-900 group-hover:text-white">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Find Your Stay</h3>
              <p className="text-gray-600 mb-5">
                Browse our curated selection of authentic Nepali homestays across the country.
              </p>
              <Link href="/homestays" className="text-gray-800 font-medium inline-flex items-center group">
                <span className="border-b border-gray-800 pb-1">Explore Homestays</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-700 transition-all group-hover:bg-gray-900 group-hover:text-white">
                <HomeIcon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Connect with Hosts</h3>
              <p className="text-gray-600 mb-5">
                Reach out directly to homestay owners and plan your authentic experience.
              </p>
              <Link href="/contact" className="text-gray-800 font-medium inline-flex items-center group">
                <span className="border-b border-gray-800 pb-1">Learn More</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-700 transition-all group-hover:bg-gray-900 group-hover:text-white">
                <Star className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Experience Nepal</h3>
              <p className="text-gray-600 mb-5">
                Immerse yourself in Nepali culture, cuisine, and traditions with locals.
              </p>
              <Link href="/testimonials" className="text-gray-800 font-medium inline-flex items-center group">
                <span className="border-b border-gray-800 pb-1">Read Stories</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Destinations */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Destinations</h2>
            <div className="w-16 h-1 bg-gray-200 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our most sought-after homestay locations
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Destination 1 */}
            <div className="group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100">
              <div className="relative h-72 w-full">
                <Image
                  src="/images/destinations/pokhara.jpg"
                  alt="Pokhara"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-5 left-5 text-white">
                  <h3 className="text-2xl font-bold">Pokhara</h3>
                  <p className="text-sm text-white/80 flex items-center mt-1">
                    <HomeIcon className="h-4 w-4 mr-1 opacity-70" />
                    32 homestays
                  </p>
                </div>
              </div>
            </div>
            
            {/* Destination 2 */}
            <div className="group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100">
              <div className="relative h-72 w-full">
                <Image
                  src="/images/destinations/kathmandu.jpg"
                  alt="Kathmandu Valley"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-5 left-5 text-white">
                  <h3 className="text-2xl font-bold">Kathmandu Valley</h3>
                  <p className="text-sm text-white/80 flex items-center mt-1">
                    <HomeIcon className="h-4 w-4 mr-1 opacity-70" />
                    47 homestays
                  </p>
                </div>
              </div>
            </div>
            
            {/* Destination 3 */}
            <div className="group rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100">
              <div className="relative h-72 w-full">
                <Image
                  src="/images/destinations/chitwan.jpg"
                  alt="Chitwan"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-5 left-5 text-white">
                  <h3 className="text-2xl font-bold">Chitwan</h3>
                  <p className="text-sm text-white/80 flex items-center mt-1">
                    <HomeIcon className="h-4 w-4 mr-1 opacity-70" />
                    28 homestays
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/homestays">
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
              <h2 className="text-3xl font-bold mb-6">Join Our Network of Homestays</h2>
              <div className="w-16 h-1 bg-gray-700 mb-8"></div>
              <p className="text-lg mb-10 text-gray-300 leading-relaxed">
                Connect with travelers from around the world seeking authentic Nepali experiences. Showcase your homestay, increase your income, and share your culture with guests.
              </p>
              
              <div className="space-y-6 mb-10">
                <div className="flex items-start">
                  <div className="bg-gray-800 rounded-full p-2 mr-4 mt-1">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg text-white">Free Registration</h3>
                    <p className="text-gray-400">Easy setup process with no upfront costs</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gray-800 rounded-full p-2 mr-4 mt-1">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg text-white">Your Own Dashboard</h3>
                    <p className="text-gray-400">Full control over your listings and bookings</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-gray-800 rounded-full p-2 mr-4 mt-1">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg text-white">Global Visibility</h3>
                    <p className="text-gray-400">Reach travelers looking for authentic experiences</p>
                  </div>
                </div>
              </div>
              
              <Link href="/register">
                <button className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-medium transition-all inline-flex items-center shadow-md">
                  Register Your Homestay
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Link>
            </div>
            
            <div className="relative h-[500px] rounded-xl overflow-hidden shadow-2xl border border-gray-800">
              <Image
                src="/images/home/homestay-owner.jpg"
                alt="Nepali homestay owner"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What People Say</h2>
            <div className="w-16 h-1 bg-gray-200 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hear from travelers and hosts who have experienced our platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-6">
                <div className="text-gray-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 inline-block fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-8 italic">
                "Finding a homestay through Nepal StayLink made our trip so much more meaningful. Our hosts were incredible and gave us insights into Nepali culture we would have missed otherwise."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0 relative overflow-hidden">
                  <Image 
                    src="/images/testimonials/sarah.jpg" 
                    alt="Sarah Johnson"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900">Sarah Johnson</h4>
                  <p className="text-sm text-gray-500">USA</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-6">
                <div className="text-gray-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 inline-block fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-8 italic">
                "As a homestay owner, joining Nepal StayLink has been transformative. The platform is easy to use, and I've connected with wonderful guests from around the world."
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0 relative overflow-hidden">
                  <Image 
                    src="/images/testimonials/ramesh.jpg" 
                    alt="Ramesh Tamang"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900">Ramesh Tamang</h4>
                  <p className="text-sm text-gray-500">Pokhara, Nepal</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-6">
                <div className="text-gray-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 inline-block fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-8 italic">
                "Nepal StayLink helped us discover hidden gems in Nepal that we'd never have found otherwise. The homestay experience was the highlight of our trip!"
              </p>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0 relative overflow-hidden">
                  <Image 
                    src="/images/testimonials/akiko.jpg" 
                    alt="Akiko Tanaka"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-gray-900">Akiko Tanaka</h4>
                  <p className="text-sm text-gray-500">Japan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image 
            src="/images/home/hero-bg.jpg"
            alt="Nepal background"
            fill
            className="object-cover"
          />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Experience Authentic Nepal?</h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light">
            Start your journey today and discover the warmth of Nepali hospitality
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/homestays">
              <button className="bg-white text-gray-900 hover:bg-gray-100 px-10 py-4 rounded-lg font-medium transition-all shadow-md">
                Find Homestays
              </button>
            </Link>
            <Link href="/register">
              <button className="bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 px-10 py-4 rounded-lg font-medium transition-all">
                List Your Property
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 