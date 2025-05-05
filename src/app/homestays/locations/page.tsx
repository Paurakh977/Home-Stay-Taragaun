'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import HomestayListing from '@/components/homestays/HomestayListing';

export default function HomestayLocationsPage() {
  // Set SEO metadata
  useEffect(() => {
    document.title = 'Homestay Locations in Nepal | Hamro Home Stay';

    // Set meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Discover authentic Nepali homestays across different locations in Nepal. Find the perfect place to stay and experience local culture and hospitality.');

    // Set canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://hamrohomestay.com/homestays/locations');
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Explore Homestays by Location
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover authentic homestay experiences across Nepal. Find accommodations in popular districts, 
            provinces, municipalities and cities.
          </p>
        </div>

        {/* Top Destinations Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Destinations in Nepal</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Popular Destinations Cards */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-40 bg-blue-100 flex items-center justify-center">
                <span className="text-6xl">🏔️</span>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2">Mountain Regions</h3>
                <p className="mb-4 text-gray-600">Experience homestays in Nepal's stunning mountain regions with breathtaking views and traditional hospitality.</p>
                <div className="space-y-2">
                  <Link href="/homestays/locations/solukhumbu-district" className="flex items-center text-primary hover:underline">
                    <MapPin className="h-4 w-4 mr-1" /> Solukhumbu District
                  </Link>
                  <Link href="/homestays/locations/kaski-district" className="flex items-center text-primary hover:underline">
                    <MapPin className="h-4 w-4 mr-1" /> Kaski District
                  </Link>
                  <Link href="/homestays/locations/mustang-district" className="flex items-center text-primary hover:underline">
                    <MapPin className="h-4 w-4 mr-1" /> Mustang District
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-40 bg-green-100 flex items-center justify-center">
                <span className="text-6xl">🌳</span>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2">Valley & Hill Regions</h3>
                <p className="mb-4 text-gray-600">Stay in Nepal's scenic valleys and hills with homestays offering authentic cultural experiences.</p>
                <div className="space-y-2">
                  <Link href="/homestays/locations/kathmandu-district" className="flex items-center text-primary hover:underline">
                    <MapPin className="h-4 w-4 mr-1" /> Kathmandu District
                  </Link>
                  <Link href="/homestays/locations/lalitpur-district" className="flex items-center text-primary hover:underline">
                    <MapPin className="h-4 w-4 mr-1" /> Lalitpur District
                  </Link>
                  <Link href="/homestays/locations/bhaktapur-district" className="flex items-center text-primary hover:underline">
                    <MapPin className="h-4 w-4 mr-1" /> Bhaktapur District
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-40 bg-yellow-100 flex items-center justify-center">
                <span className="text-6xl">🌿</span>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2">Terai & Jungle Regions</h3>
                <p className="mb-4 text-gray-600">Explore homestays in Nepal's lush southern plains and jungle areas with diverse wildlife and cultures.</p>
                <div className="space-y-2">
                  <Link href="/homestays/locations/chitwan-district" className="flex items-center text-primary hover:underline">
                    <MapPin className="h-4 w-4 mr-1" /> Chitwan District
                  </Link>
                  <Link href="/homestays/locations/bardiya-district" className="flex items-center text-primary hover:underline">
                    <MapPin className="h-4 w-4 mr-1" /> Bardiya District
                  </Link>
                  <Link href="/homestays/locations/jhapa-district" className="flex items-center text-primary hover:underline">
                    <MapPin className="h-4 w-4 mr-1" /> Jhapa District
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Provinces Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Provinces of Nepal</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/homestays/locations/koshi-province" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Koshi Province</h3>
              <p className="text-sm text-gray-600">Eastern Nepal</p>
            </Link>
            <Link href="/homestays/locations/madhesh-province" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Madhesh Province</h3>
              <p className="text-sm text-gray-600">Southern Plains</p>
            </Link>
            <Link href="/homestays/locations/bagmati-province" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Bagmati Province</h3>
              <p className="text-sm text-gray-600">Central Nepal</p>
            </Link>
            <Link href="/homestays/locations/gandaki-province" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Gandaki Province</h3>
              <p className="text-sm text-gray-600">Western Hills</p>
            </Link>
            <Link href="/homestays/locations/lumbini-province" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Lumbini Province</h3>
              <p className="text-sm text-gray-600">Western Terai</p>
            </Link>
            <Link href="/homestays/locations/karnali-province" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Karnali Province</h3>
              <p className="text-sm text-gray-600">Mid-Western Mountains</p>
            </Link>
            <Link href="/homestays/locations/sudurpashchim-province" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Sudurpashchim Province</h3>
              <p className="text-sm text-gray-600">Far-Western Nepal</p>
            </Link>
          </div>
        </section>
        
        {/* Popular Districts Grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Districts for Homestays</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link href="/homestays/locations/kathmandu-district" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Kathmandu</h3>
            </Link>
            <Link href="/homestays/locations/lalitpur-district" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Lalitpur</h3>
            </Link>
            <Link href="/homestays/locations/kaski-district" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Kaski</h3>
            </Link>
            <Link href="/homestays/locations/chitwan-district" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Chitwan</h3>
            </Link>
            <Link href="/homestays/locations/solukhumbu-district" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Solukhumbu</h3>
            </Link>
            <Link href="/homestays/locations/dolakha-district" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Dolakha</h3>
            </Link>
            <Link href="/homestays/locations/gorkha-district" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Gorkha</h3>
            </Link>
            <Link href="/homestays/locations/mustang-district" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Mustang</h3>
            </Link>
            <Link href="/homestays/locations/bardiya-district" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Bardiya</h3>
            </Link>
            <Link href="/homestays/locations/ilam-district" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Ilam</h3>
            </Link>
            <Link href="/homestays/locations/bhaktapur-district" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Bhaktapur</h3>
            </Link>
            <Link href="/homestays/locations/lamjung-district" className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-semibold">Lamjung</h3>
            </Link>
          </div>
        </section>
        
        {/* Latest Homestays section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Homestays Across Nepal</h2>
          <HomestayListing />
        </section>
      </div>
    </div>
  );
} 