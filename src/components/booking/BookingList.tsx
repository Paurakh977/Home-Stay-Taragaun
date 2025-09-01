'use client';

import React, { useState } from 'react';
import { Calendar, Users, Home, Clock, Phone, Mail, MessageSquare, Check, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Booking, BookingListProps } from '@/types/booking';

const BookingList: React.FC<BookingListProps> = ({
  bookings,
  loading = false,
  onStatusUpdate,
  onRefresh,
  showActions = true
}) => {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string, message?: string) => {
    if (!onStatusUpdate) return;

    setUpdatingBooking(bookingId);
    try {
      await onStatusUpdate(bookingId, newStatus, message ? { message } : undefined);
    } finally {
      setUpdatingBooking(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
        <p className="text-gray-600 mb-4">
          You haven't received any booking requests yet.
        </p>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline">
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div key={booking.bookingId} className="bg-white rounded-lg border hover:shadow-md transition-shadow">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {booking.guestInfo.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Booking ID: {booking.bookingId}
                </p>
                <p className="text-xs text-gray-500">
                  Requested on {formatDate(booking.createdAt)}
                </p>
              </div>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>

            {/* Booking Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <p className="font-medium">Check-in</p>
                  <p className="text-gray-600">{formatDate(booking.checkInDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <p className="font-medium">Check-out</p>
                  <p className="text-gray-600">{formatDate(booking.checkOutDate)}</p>
                </div>
              </div>

              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <p className="font-medium">Guests</p>
                  <p className="text-gray-600">{booking.guestInfo.numberOfGuests} guests</p>
                </div>
              </div>

              <div className="flex items-center text-sm">
                <Home className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <p className="font-medium">Rooms</p>
                  <p className="text-gray-600">{booking.guestInfo.numberOfRooms} rooms</p>
                </div>
              </div>
            </div>

            {/* Duration and Contact */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {booking.numberOfNights} night{booking.numberOfNights !== 1 ? 's' : ''}
              </div>
              
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                {booking.guestInfo.phone}
              </div>
              
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                {booking.guestInfo.email}
              </div>
            </div>

            {/* Special Requests */}
            {(booking.guestInfo.specialRequests || booking.guestInfo.dietaryRequirements) && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Special Requests</h4>
                {booking.guestInfo.dietaryRequirements && (
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Dietary:</strong> {booking.guestInfo.dietaryRequirements}
                  </p>
                )}
                {booking.guestInfo.specialRequests && (
                  <p className="text-sm text-gray-700">
                    <strong>Requests:</strong> {booking.guestInfo.specialRequests}
                  </p>
                )}
              </div>
            )}

            {/* Food Services */}
            {(booking.guestInfo.needsFood?.breakfast || booking.guestInfo.needsFood?.lunch || booking.guestInfo.needsFood?.dinner) && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Food Services Requested</h4>
                <div className="flex flex-wrap gap-2">
                  {booking.guestInfo.needsFood?.breakfast && (
                    <Badge variant="outline">Breakfast</Badge>
                  )}
                  {booking.guestInfo.needsFood?.lunch && (
                    <Badge variant="outline">Lunch</Badge>
                  )}
                  {booking.guestInfo.needsFood?.dinner && (
                    <Badge variant="outline">Dinner</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Homestay Response */}
            {booking.homestayResponse && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Your Response</h4>
                {booking.homestayResponse.message && (
                  <p className="text-sm text-blue-800 mb-2">{booking.homestayResponse.message}</p>
                )}
                {booking.homestayResponse.estimatedCost && (
                  <p className="text-sm text-blue-800">
                    <strong>Estimated Cost:</strong> {booking.homestayResponse.currency || 'NPR'} {booking.homestayResponse.estimatedCost}
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-1">
                  Responded on {formatDate(booking.homestayResponse.respondedAt)}
                </p>
              </div>
            )}

            {/* Actions */}
            {showActions && booking.status === 'pending' && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate(booking.bookingId, 'confirmed')}
                  disabled={updatingBooking === booking.bookingId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Confirm
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate(booking.bookingId, 'rejected')}
                  disabled={updatingBooking === booking.bookingId}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedBooking(booking)}
                  disabled={updatingBooking === booking.bookingId}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Respond
                </Button>
              </div>
            )}

            {showActions && booking.status === 'confirmed' && (
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate(booking.bookingId, 'completed')}
                  disabled={updatingBooking === booking.bookingId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Mark Complete
                </Button>
              </div>
            )}

            {!showActions && (
              <div className="flex justify-end pt-4 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Response Modal would go here */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Respond to Booking</h3>
            <p className="text-gray-600 mb-4">
              Send a response to {selectedBooking.guestInfo.name} for booking {selectedBooking.bookingId}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                Cancel
              </Button>
              <Button onClick={() => setSelectedBooking(null)}>
                Send Response
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingList;
