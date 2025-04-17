"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranding } from "@/context/BrandingContext";

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const branding = useBranding();
  
  // Use branding slider images or fallback to defaults
  const slides = branding.sliderImages.length > 0 
    ? branding.sliderImages 
    : [
        '/images/homestay-1.jpg',
        '/images/homestay-2.jpg',
        '/images/homestay-3.jpg',
      ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative h-[500px] w-full overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            index === currentIndex ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="relative h-full w-full">
            <Image
              src={slide}
              alt={`Homestay slide ${index + 1}`}
              fill
              priority={index === 0}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-white text-center max-w-3xl px-6">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-md">
                  {branding.brandName || 'Hamro Home Stay'}
                </h1>
                <p className="text-xl md:text-2xl drop-shadow-md">
                  {branding.brandDescription || 'Experience authentic Nepali hospitality'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 focus:outline-none"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 focus:outline-none"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-2 w-8 rounded-full transition-all",
              index === currentIndex ? "bg-white" : "bg-white/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 