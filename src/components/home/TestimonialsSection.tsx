"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote: "Our stay at the Hamro Home Stay was incredible. The hospitality was unmatched, and we felt like part of the family. The views were breathtaking!",
    author: "Sarah Johnson",
    location: "United States",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop"
  },
  {
    quote: "The authentic food, the warm hospitality, and the cultural experience made our stay unforgettable. Definitely coming back next year!",
    author: "James Wilson",
    location: "United Kingdom",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop"
  },
  {
    quote: "If you want to experience the real Nepal, this is the place. Our host family was amazing, and the home-cooked meals were the best we had during our entire trip.",
    author: "Emma Thompson",
    location: "Australia",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop"
  },
  {
    quote: "The perfect blend of comfort and authentic cultural experience. Waking up to mountain views every morning was magical!",
    author: "David Chen",
    location: "Canada",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop"
  }
];

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevTestimonial = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">What Our Guests Say</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don&apos;t just take our word for it - hear from our happy guests
          </p>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="flex-shrink-0 w-full border-0 shadow-none">
                  <CardContent className="p-8 flex flex-col items-center text-center">
                    <Quote className="h-12 w-12 text-primary/20 mb-6" />
                    <p className="text-lg md:text-xl text-gray-700 italic mb-8">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <div className="flex items-center">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.author}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">{testimonial.author}</h4>
                        <p className="text-gray-500">{testimonial.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Navigation buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 border border-gray-300 hover:bg-gray-100 rounded-full z-10"
            onClick={prevTestimonial}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 border border-gray-300 hover:bg-gray-100 rounded-full z-10"
            onClick={nextTestimonial}
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
          
          {/* Indicator dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === activeIndex ? "bg-primary" : "bg-gray-300"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 