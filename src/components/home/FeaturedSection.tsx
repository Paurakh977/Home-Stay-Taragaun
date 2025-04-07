import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: "🏠",
    title: "Authentic Local Experience",
    description: "Stay with local families and experience authentic Nepali hospitality and culture.",
    image: "https://images.unsplash.com/photo-1599619351208-3e6c839d6828?q=80&w=600&auto=format&fit=crop"
  },
  {
    icon: "🍽️",
    title: "Traditional Cuisine",
    description: "Enjoy homemade Nepali dishes prepared with locally sourced organic ingredients.",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=600&auto=format&fit=crop"
  },
  {
    icon: "🌿",
    title: "Scenic Locations",
    description: "Our home stays are situated in beautiful locations with stunning mountain views.",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=600&auto=format&fit=crop"
  },
  {
    icon: "🧳",
    title: "Personalized Service",
    description: "Each home stay offers personalized service to make your stay comfortable and memorable.",
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=600&auto=format&fit=crop"
  }
];

const FeaturedSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Why Choose Our Home Stays</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the warmth and authenticity of Nepali culture through our carefully selected home stays
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="relative h-48 w-full">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span className="text-2xl">{feature.icon}</span> {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/homestays">
            <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6" size="lg">
              View All Home Stays
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedSection; 