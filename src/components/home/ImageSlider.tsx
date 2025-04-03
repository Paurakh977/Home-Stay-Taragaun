"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Images from Unsplash - high quality home stay images
const SLIDER_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542718610-a1d656d1884c?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1920&auto=format&fit=crop",
];

interface ImageSliderProps {
  autoSlideInterval?: number;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ autoSlideInterval = 5000 }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === SLIDER_IMAGES.length - 1 ? 0 : prevIndex + 1
    );
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? SLIDER_IMAGES.length - 1 : prevIndex - 1
    );
  }, []);

  // Auto slide functionality
  useEffect(() => {
    const interval = setInterval(nextSlide, autoSlideInterval);
    
    return () => clearInterval(interval);
  }, [nextSlide, autoSlideInterval]);

  return (
    <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
      {/* Images */}
      {SLIDER_IMAGES.map((imageUrl, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
            index === currentImageIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={imageUrl}
            alt={`Home Stay Image ${index + 1}`}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 100vw"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      ))}

      {/* Text overlay */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center z-10 px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          Hamro Home Stay
        </h1>
        <p className="text-xl md:text-2xl text-white max-w-2xl mb-8 drop-shadow-lg">
          Experience authentic Nepali hospitality in our beautiful home stays
        </p>
        <Button 
          className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
          size="lg"
        >
          Book Your Stay
        </Button>
      </div>

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full z-20"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full z-20"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Indicator dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
        {SLIDER_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentImageIndex ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider; 