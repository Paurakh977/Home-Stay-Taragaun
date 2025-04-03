"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Home } from "lucide-react";

export default function ScrollPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Always start with popup not visible and not dismissed
    setIsDismissed(false);
    setIsVisible(false);

    // Add a small delay before starting to check for scrolling
    // This ensures the component is fully mounted
    const timeoutId = setTimeout(() => {
      const handleScroll = () => {
        // Show popup when user has scrolled down a bit (200px)
        if (window.scrollY > 200 && !isDismissed) {
          setIsVisible(true);
        }
      };

      // Check once in case user has already scrolled
      handleScroll();
      
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [isDismissed]); // Add isDismissed to dependency array

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-slideUp">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary rounded-full p-2">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Host your Home Stay</h3>
              <p className="mt-1 text-sm text-gray-500">Would you like to register your homestay and start hosting guests?</p>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="flex-shrink-0 ml-4 bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex justify-end space-x-3">
          <button
            onClick={handleDismiss}
            className="text-sm text-gray-600 hover:text-gray-500"
          >
            Not now
          </button>
          <Link 
            href="/register"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none"
          >
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
} 