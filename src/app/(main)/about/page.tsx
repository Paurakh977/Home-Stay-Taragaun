'use client';

import Image from "next/image";
import Link from "next/link";
import { Heart, Users, Shield, Award, Sparkles, GraduationCap } from "lucide-react";
import { useWebContent } from "@/context/WebContentContext";

// Helper function to get the correct icon component
const getIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    Heart: <Heart className="h-7 w-7" />,
    Users: <Users className="h-7 w-7" />,
    Shield: <Shield className="h-7 w-7" />,
    Award: <Award className="h-7 w-7" />,
    Sparkles: <Sparkles className="h-7 w-7" />,
    GraduationCap: <GraduationCap className="h-7 w-7" />
  };
  
  return iconMap[iconName] || <Heart className="h-7 w-7" />;
};

export default function About() {
  const { content, loading } = useWebContent();
  
  // Use default content if still loading or content not available
  const aboutContent = loading || !content?.aboutPage
    ? {
        hero: {
          title: "About Us",
          subtitle: "Connecting travelers with authentic Nepali homestays while empowering local communities.",
          backgroundImage: "/images/about/nepal-story.jpg"
        },
        story: {
          title: "Our Story",
          content: "Nepal StayLink was born from a passion for authentic travel experiences and a desire to support Nepali communities. We recognized that traditional accommodations often failed to provide genuine cultural immersion, while many homestay owners lacked the resources to connect with global travelers. Founded in 2022, our platform has grown from a small collection of homestays around Kathmandu to a nationwide network spanning the foothills of the Himalayas to the jungles of Chitwan. Our mission remains unchanged: to create meaningful connections between travelers and locals while ensuring economic benefits flow directly to communities.",
          imagePath: "/images/about/nepal-story.jpg"
        },
        values: {
          title: "Our Values",
          subtitle: "These core principles guide everything we do at Nepal StayLink.",
          items: [
            {
              icon: "Heart",
              title: "Authentic Experiences",
              description: "We believe in facilitating genuine cultural exchanges and immersive experiences that create meaningful connections."
            },
            {
              icon: "Users",
              title: "Community Empowerment",
              description: "Our platform directly benefits local communities by creating sustainable income opportunities and promoting cultural preservation."
            },
            {
              icon: "Shield",
              title: "Trust & Safety",
              description: "Every homestay is verified to ensure quality, safety, and authenticity for both hosts and guests."
            }
          ]
        },
        team: {
          title: "Meet Our Team",
          subtitle: "The passionate individuals behind Nepal StayLink who work tirelessly to connect travelers with authentic Nepali experiences.",
          members: [
            {
              name: "Asha Tamang",
              position: "Founder & CEO",
              photoPath: "/images/team/team-1.jpg",
              order: 1
            },
            {
              name: "Rajesh Sharma",
              position: "Chief Technology Officer",
              photoPath: "/images/team/team-2.jpg",
              order: 2
            },
            {
              name: "Sunita Rai",
              position: "Head of Community",
              photoPath: "/images/team/team-3.jpg",
              order: 3
            },
            {
              name: "Deepak Gurung",
              position: "Marketing Director",
              photoPath: "/images/team/team-4.jpg",
              order: 4
            }
          ]
        },
        offerings: {
          title: "What We Offer",
          subtitle: "Discover what makes Nepal StayLink the premier platform for authentic homestay experiences.",
          features: [
            {
              icon: "Award",
              title: "Verified Homestays",
              description: "Every homestay in our network is personally verified to ensure quality and authenticity."
            },
            {
              icon: "Sparkles",
              title: "Unique Experiences",
              description: "From cooking classes to cultural ceremonies, our homestays offer experiences beyond just accommodation."
            },
            {
              icon: "GraduationCap",
              title: "Host Training",
              description: "We provide comprehensive training and resources for our homestay hosts to ensure excellent guest experiences."
            },
            {
              icon: "Users",
              title: "Community Focus",
              description: "A portion of our fees goes directly to community development projects in homestay regions."
            },
            {
              icon: "Shield",
              title: "Secure Platform",
              description: "Our secure technology platform provides peace of mind for both hosts and guests."
            },
            {
              icon: "Heart",
              title: "Personalized Support",
              description: "Dedicated customer support team available to assist with any questions or needs."
            }
          ]
        },
        impact: {
          title: "Our Impact",
          content: "At Nepal StayLink, we're proud of the positive impact we've made on local communities and sustainable tourism in Nepal. Through our platform:",
          stats: [
            "Over 200 families have gained sustainable income through homestay hosting",
            "More than $500,000 has been directly invested in rural Nepali communities",
            "Cultural preservation initiatives in 15 villages have received support",
            "5,000+ travelers have experienced authentic Nepali hospitality",
            "20+ community development projects have been funded"
          ],
          imagePath: "/images/about/nepal-impact.jpg"
        },
        mission: {
          statement: "To connect travelers with authentic Nepali experiences while empowering local communities through sustainable tourism that preserves cultural heritage and creates economic opportunities."
        },
        cta: {
          title: "Join the Nepal StayLink Community",
          subtitle: "Whether you're a traveler seeking authentic experiences or a homeowner looking to share your culture, become part of our growing community.",
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
    : content.aboutPage;
  
  // Sort team members by order property
  const teamMembers = aboutContent.team.members.sort((a: any, b: any) => a.order - b.order);
    
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <Image
            src={aboutContent.hero.backgroundImage}
            alt="Nepal StayLink Story"
            fill
            className="object-cover"
          />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {aboutContent.hero.title}
            </h1>
            <div className="w-16 h-1 bg-gray-300 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {aboutContent.hero.subtitle}
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
                src={aboutContent.story.imagePath}
                alt="Nepal StayLink Story"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">{aboutContent.story.title}</h2>
              <div className="w-12 h-1 bg-gray-200 mb-8"></div>
              <div className="prose prose-lg text-gray-600 max-w-none">
                <p className="mb-4">
                  {aboutContent.story.content}
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
            <h2 className="text-2xl font-bold mb-4 text-gray-900">{aboutContent.values.title}</h2>
            <div className="w-16 h-1 bg-gray-300 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {aboutContent.values.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {aboutContent.values.items.map((value: any, index: number) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-200 flex flex-col items-center text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-700 mb-6">
                  {getIcon(value.icon)}
                </div>
                <h3 className="text-xl font-medium mb-4 text-gray-900">{value.title}</h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">{aboutContent.team.title}</h2>
            <div className="w-16 h-1 bg-gray-300 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {aboutContent.team.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
            {teamMembers.map((member: any, index: number) => (
              <div key={index} className="text-center group">
                <div className="relative mx-auto w-36 h-36 rounded-full overflow-hidden mb-5 shadow-sm border-2 border-white group-hover:shadow-md transition-all">
                  <Image
                    src={member.photoPath}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-1">{member.name}</h3>
                <p className="text-gray-600">{member.position}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">{aboutContent.offerings.title}</h2>
            <div className="w-16 h-1 bg-gray-300 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {aboutContent.offerings.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {aboutContent.offerings.features.map((feature: any, index: number) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-700 mb-6">
                  {getIcon(feature.icon)}
                </div>
                <h3 className="text-xl font-medium mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">{aboutContent.impact.title}</h2>
              <div className="w-12 h-1 bg-gray-200 mb-8"></div>
              <div className="prose prose-lg text-gray-600 max-w-none">
                <p className="mb-6">
                  {aboutContent.impact.content}
                </p>
                <ul className="space-y-3">
                  {aboutContent.impact.stats.map((stat: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <div className="bg-gray-100 p-1 rounded-full mr-3 mt-1.5">
                        <svg className="h-3 w-3 text-gray-700" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                      </div>
                      <span>{stat}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6">
                  We're committed to responsible tourism that benefits both travelers and communities while preserving Nepal's rich cultural heritage.
                </p>
              </div>
            </div>
            
            <div className="relative h-[450px] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <Image
                src={aboutContent.impact.imagePath}
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
            "{aboutContent.mission.statement}"
          </p>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">{aboutContent.cta.title}</h2>
          <p className="text-lg max-w-2xl mx-auto mb-10 text-gray-600">
            {aboutContent.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href={aboutContent.cta.primaryButton.link}>
              <button className="bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 px-8 py-3 rounded-lg font-medium transition-all shadow-sm">
                {aboutContent.cta.primaryButton.text}
              </button>
            </Link>
            <Link href={aboutContent.cta.secondaryButton.link}>
              <button className="bg-gray-900 text-white hover:bg-black px-8 py-3 rounded-lg font-medium transition-all shadow-sm">
                {aboutContent.cta.secondaryButton.text}
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 