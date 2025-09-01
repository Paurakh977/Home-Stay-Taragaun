'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, MapPin, Calendar, Users, Home, ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Booking } from '@/types/booking';

function BookingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams?.get('bookingId');
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      const result = await response.json();

      if (result.success) {
        setBooking(result.data);
      } else {
        setError(result.message || 'Failed to fetch booking details');
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('An error occurred while fetching booking details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGoogleMapsUrl = () => {
    if (!booking) return '#';

    // Check if we have coordinates from the booking data
    const coordinates = (booking as any).homestayCoordinates;
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      // Use coordinates for precise location
      return `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
    }

    // Fallback to search query if no coordinates
    const query = encodeURIComponent(`${booking.homestayName} homestay Nepal`);
    return `https://www.google.com/maps/search/${query}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The booking you are looking for could not be found.'}</p>
          <Button onClick={() => router.push('/')} className="w-full">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8 text-center">
            <div className="text-green-500 mb-4">
              <CheckCircle size={64} className="mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Your booking request has been successfully submitted. The homestay will review your request and get back to you soon.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">Booking ID: {booking.bookingId}</p>
              <p className="text-green-700 text-sm mt-1">
                Please save this booking ID for your records
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h2>
            
            <div className="space-y-6">
              {/* Homestay Info */}
              <div className="flex items-start">
                <Home className="text-primary mt-1 mr-3" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900">{booking.homestayName}</h3>
                  <p className="text-gray-600 text-sm">Homestay</p>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-start">
                <Calendar className="text-primary mt-1 mr-3" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900">Stay Duration</h3>
                  <p className="text-gray-600">
                    {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {booking.numberOfNights} night{booking.numberOfNights !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Guests */}
              <div className="flex items-start">
                <Users className="text-primary mt-1 mr-3" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900">Guests & Rooms</h3>
                  <p className="text-gray-600">
                    {booking.guestInfo.numberOfGuests} guest{booking.guestInfo.numberOfGuests !== 1 ? 's' : ''}, {booking.guestInfo.numberOfRooms} room{booking.guestInfo.numberOfRooms !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Guest Info */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Guest Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">{booking.guestInfo.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{booking.guestInfo.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium">{booking.guestInfo.phone}</p>
                  </div>
                  {booking.guestInfo.arrivalTime && (
                    <div>
                      <span className="text-gray-500">Expected Arrival:</span>
                      <p className="font-medium">{booking.guestInfo.arrivalTime}</p>
                    </div>
                  )}
                </div>

                {/* Food Services */}
                {(booking.guestInfo.needsFood?.breakfast || booking.guestInfo.needsFood?.lunch || booking.guestInfo.needsFood?.dinner) && (
                  <div className="mt-4">
                    <span className="text-gray-500">Food Services Requested:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {booking.guestInfo.needsFood?.breakfast && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Breakfast</span>
                      )}
                      {booking.guestInfo.needsFood?.lunch && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Lunch</span>
                      )}
                      {booking.guestInfo.needsFood?.dinner && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Dinner</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                {(booking.guestInfo.specialRequests || booking.guestInfo.dietaryRequirements) && (
                  <div className="mt-4 space-y-2">
                    {booking.guestInfo.dietaryRequirements && (
                      <div>
                        <span className="text-gray-500">Dietary Requirements:</span>
                        <p className="text-gray-700">{booking.guestInfo.dietaryRequirements}</p>
                      </div>
                    )}
                    {booking.guestInfo.specialRequests && (
                      <div>
                        <span className="text-gray-500">Special Requests:</span>
                        <p className="text-gray-700">{booking.guestInfo.specialRequests}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What's Next?</h2>
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                <span>The homestay will review your booking request</span>
              </div>
              <div className="flex items-center text-gray-600">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                <span>You'll receive a confirmation email with further details</span>
              </div>
              <div className="flex items-center text-gray-600">
                <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                <span>The homestay may contact you directly for any clarifications</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <MapPin size={20} className="mr-2" />
                View Location on Maps
                <ExternalLink size={16} className="ml-2" />
              </a>
              
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="px-6 py-3"
              >
                Browse More Homestays
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}
