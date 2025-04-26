import Image from "next/image";
import Link from "next/link";
import { Heart, Users, Shield, Award, Sparkles, GraduationCap } from "lucide-react";

export default function About() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <Image
            src="https://images.unsplash.com/photo-1625050789384-f6698e5d3afd?q=80&w=2574&auto=format&fit=crop"
            alt="Nepal StayLink Story"
            fill
            className="object-cover"
          />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              About Us
            </h1>
            <div className="w-16 h-1 bg-gray-300 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Connecting travelers with authentic Nepali homestays while empowering local communities.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative h-80 md:h-full min-h-[400px] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <Image
                src="https://images.unsplash.com/photo-1625050789384-f6698e5d3afd?q=80&w=2574&auto=format&fit=crop"
                alt="Nepal StayLink Story"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Our Story</h2>
              <div className="w-12 h-1 bg-gray-200 mb-8"></div>
              <div className="prose prose-lg text-gray-600 max-w-none">
                <p className="mb-4">
                  Nepal StayLink was born from a passion for authentic travel experiences and a desire to support Nepali communities. We recognized that traditional accommodations often failed to provide genuine cultural immersion, while many homestay owners lacked the resources to connect with global travelers.
                </p>
                <p>
                  Founded in 2022, our platform has grown from a small collection of homestays around Kathmandu to a nationwide network spanning the foothills of the Himalayas to the jungles of Chitwan. Our mission remains unchanged: to create meaningful connections between travelers and locals while ensuring economic benefits flow directly to communities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Our Values</h2>
            <div className="w-16 h-1 bg-gray-300 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These core principles guide everything we do at Nepal StayLink.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-200 flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-700 mb-6">
                <Heart className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-medium mb-4 text-gray-900">Authentic Experiences</h3>
              <p className="text-gray-600">
                We believe in facilitating genuine cultural exchanges and immersive experiences that create meaningful connections.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-200 flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-700 mb-6">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-medium mb-4 text-gray-900">Community Empowerment</h3>
              <p className="text-gray-600">
                Our platform directly benefits local communities by creating sustainable income opportunities and promoting cultural preservation.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-200 flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-700 mb-6">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-medium mb-4 text-gray-900">Trust & Safety</h3>
              <p className="text-gray-600">
                Every homestay is verified to ensure quality, safety, and authenticity for both hosts and guests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Meet Our Team</h2>
            <div className="w-16 h-1 bg-gray-300 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The passionate individuals behind Nepal StayLink who work tirelessly to connect travelers with authentic Nepali experiences.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
            {/* Team Member 1 */}
            <div className="text-center group">
              <div className="relative mx-auto w-36 h-36 rounded-full overflow-hidden mb-5 shadow-sm border-2 border-white group-hover:shadow-md transition-all">
                <Image
                  src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=2670&auto=format&fit=crop"
                  alt="Asha Tamang"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-1">Asha Tamang</h3>
              <p className="text-gray-600">Founder & CEO</p>
            </div>
            
            {/* Team Member 2 */}
            <div className="text-center group">
              <div className="relative mx-auto w-36 h-36 rounded-full overflow-hidden mb-5 shadow-sm border-2 border-white group-hover:shadow-md transition-all">
                <Image
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2574&auto=format&fit=crop"
                  alt="Rajesh Sharma"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-1">Rajesh Sharma</h3>
              <p className="text-gray-600">Chief Technology Officer</p>
            </div>
            
            {/* Team Member 3 */}
            <div className="text-center group">
              <div className="relative mx-auto w-36 h-36 rounded-full overflow-hidden mb-5 shadow-sm border-2 border-white group-hover:shadow-md transition-all">
                <Image
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2574&auto=format&fit=crop"
                  alt="Sunita Rai"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-1">Sunita Rai</h3>
              <p className="text-gray-600">Head of Community</p>
            </div>
            
            {/* Team Member 4 */}
            <div className="text-center group">
              <div className="relative mx-auto w-36 h-36 rounded-full overflow-hidden mb-5 shadow-sm border-2 border-white group-hover:shadow-md transition-all">
                <Image
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2574&auto=format&fit=crop"
                  alt="Deepak Gurung"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-1">Deepak Gurung</h3>
              <p className="text-gray-600">Marketing Director</p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">What We Offer</h2>
            <div className="w-16 h-1 bg-gray-300 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover what makes Nepal StayLink the premier platform for authentic homestay experiences.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-700 mb-6">
                <Award className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-gray-900">Verified Homestays</h3>
              <p className="text-gray-600">
                Every homestay in our network is personally verified to ensure quality and authenticity.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-700 mb-6">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-gray-900">Unique Experiences</h3>
              <p className="text-gray-600">
                From cooking classes to cultural ceremonies, our homestays offer experiences beyond just accommodation.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-700 mb-6">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-gray-900">Host Training</h3>
              <p className="text-gray-600">
                We provide comprehensive training and resources for our homestay hosts to ensure excellent guest experiences.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-700 mb-6">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-gray-900">Community Focus</h3>
              <p className="text-gray-600">
                A portion of our fees goes directly to community development projects in homestay regions.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-700 mb-6">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-gray-900">Secure Platform</h3>
              <p className="text-gray-600">
                Our secure technology platform provides peace of mind for both hosts and guests.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-700 mb-6">
                <Heart className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-gray-900">Personalized Support</h3>
              <p className="text-gray-600">
                Dedicated customer support team available to assist with any questions or needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Our Impact</h2>
              <div className="w-12 h-1 bg-gray-200 mb-8"></div>
              <div className="prose prose-lg text-gray-600 max-w-none">
                <p className="mb-6">
                  At Nepal StayLink, we're proud of the positive impact we've made on local communities and sustainable tourism in Nepal. Through our platform:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="bg-gray-100 p-1 rounded-full mr-3 mt-1.5">
                      <svg className="h-3 w-3 text-gray-700" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                    <span>Over 200 families have gained sustainable income through homestay hosting</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-gray-100 p-1 rounded-full mr-3 mt-1.5">
                      <svg className="h-3 w-3 text-gray-700" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                    <span>More than $500,000 has been directly invested in rural Nepali communities</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-gray-100 p-1 rounded-full mr-3 mt-1.5">
                      <svg className="h-3 w-3 text-gray-700" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                    <span>Cultural preservation initiatives in 15 villages have received support</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-gray-100 p-1 rounded-full mr-3 mt-1.5">
                      <svg className="h-3 w-3 text-gray-700" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                    <span>5,000+ travelers have experienced authentic Nepali hospitality</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-gray-100 p-1 rounded-full mr-3 mt-1.5">
                      <svg className="h-3 w-3 text-gray-700" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                    <span>20+ community development projects have been funded</span>
                  </li>
                </ul>
                <p className="mt-6">
                  We're committed to responsible tourism that benefits both travelers and communities while preserving Nepal's rich cultural heritage.
                </p>
              </div>
            </div>
            
            <div className="relative h-[450px] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <Image
                src="https://images.unsplash.com/photo-1604710745236-d96fe5fc6d2d?q=80&w=2574&auto=format&fit=crop"
                alt="Nepal StayLink Impact"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
          <div className="w-16 h-1 bg-gray-700 mx-auto mb-8"></div>
          <p className="text-2xl font-light mb-0 leading-relaxed">
            "To connect travelers with authentic Nepali experiences while empowering local communities through sustainable tourism that preserves cultural heritage and creates economic opportunities."
          </p>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Join the Nepal StayLink Community</h2>
          <p className="text-lg max-w-2xl mx-auto mb-10 text-gray-600">
            Whether you're a traveler seeking authentic experiences or a homeowner looking to share your culture, become part of our growing community.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/homestays">
              <button className="bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 px-8 py-3 rounded-lg font-medium transition-all shadow-sm">
                Find Homestays
              </button>
            </Link>
            <Link href="/register">
              <button className="bg-gray-900 text-white hover:bg-black px-8 py-3 rounded-lg font-medium transition-all shadow-sm">
                List Your Property
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 