'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, UserIcon, ClockIcon, PhoneIcon, MailIcon, HomeIcon, UtensilsIcon } from 'lucide-react';
import Link from 'next/link';
import type { Booking } from '@/types/booking';
import { useBookingNotifications } from '@/context/BookingNotificationContext';

interface BookingManagementProps {
  homestayId: string;
  adminUsername?: string;
}

interface AvailabilitySettings {
  isAvailable: boolean;
}

export default function BookingManagement({ homestayId, adminUsername }: BookingManagementProps) {
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySettings>({
    isAvailable: true
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Use booking notifications to refresh data when new bookings arrive
  const { notifications } = useBookingNotifications();

  useEffect(() => {
    fetchRecentBookings();
    fetchAvailability();
  }, [homestayId]);

  // Refresh bookings when new notifications arrive
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (latestNotification.type === 'new_booking' && latestNotification.homestayId === homestayId) {
        console.log('📋 BookingManagement - Refreshing bookings due to new notification');
        fetchRecentBookings();
      }
    }
  }, [notifications, homestayId]);

  const fetchRecentBookings = async () => {
    try {
      console.log('📋 BookingManagement - Fetching bookings for homestayId:', homestayId);
      const response = await fetch(`/api/bookings?homestayId=${homestayId}&limit=5`, {
        credentials: 'include' // Include cookies for JWT authentication
      });
      const result = await response.json();
      console.log('📋 BookingManagement - Bookings API response:', result);
      if (result.success) {
        setRecentBookings(result.data || []);
        console.log('📋 BookingManagement - Set recent bookings:', result.data);
      } else {
        console.error('📋 BookingManagement - API returned error:', result.message);
      }
    } catch (error) {
      console.error('📋 BookingManagement - Error fetching bookings:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await fetch(`/api/homestays/${homestayId}/availability`, {
        credentials: 'include' // Include cookies for JWT authentication
      });
      const result = await response.json();
      if (result.success) {
        setAvailability(result.data);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (newAvailability: boolean) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/homestays/${homestayId}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for JWT authentication
        body: JSON.stringify({
          isAvailable: newAvailability
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAvailability(prev => ({ ...prev, isAvailable: newAvailability }));
      } else {
        console.error('Failed to update availability:', result.message);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">पुष्टि भएको</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">पेन्डिङ</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">रद्द</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">सम्पन्न</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('ne-NP');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Availability Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>उपलब्धता व्यवस्थापन</span>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${availability.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {availability.isAvailable ? 'उपलब्ध' : 'अनुपलब्ध'}
              </span>
              <Switch
                checked={availability.isAvailable}
                onCheckedChange={updateAvailability}
                disabled={updating}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center">
            {availability.isAvailable
              ? 'तपाईंको होमस्टे अहिले बुकिङका लागि उपलब्ध छ।'
              : 'तपाईंको होमस्टे अहिले बुकिङका लागि उपलब्ध छैन।'
            }
          </p>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>आगामी पाहुनाहरू</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">कुनै बुकिङ फेला परेन</h3>
              <p className="text-gray-600">अहिलेसम्म कुनै बुकिङ आएको छैन।</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{booking.guestInfo.name}</span>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  
                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <PhoneIcon className="h-3 w-3" />
                      <span>{booking.guestInfo.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MailIcon className="h-3 w-3" />
                      <span>{booking.guestInfo.email}</span>
                    </div>
                  </div>
                  
                  {/* Booking Details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{formatDate(booking.checkInDate)}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <HomeIcon className="h-3 w-3" />
                      <span>{booking.guestInfo.numberOfRooms} कोठा</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <UserIcon className="h-3 w-3" />
                      <span>{booking.guestInfo.numberOfGuests} पाहुना</span>
                    </div>
                  </div>
                  
                  {/* Arrival Time */}
                  {booking.guestInfo.arrivalTime && (
                    <div className="mb-3">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <ClockIcon className="h-3 w-3" />
                        <span>आगमन समय: {booking.guestInfo.arrivalTime}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Food Requirements */}
                  {booking.guestInfo.needsFood && (booking.guestInfo.needsFood.breakfast || booking.guestInfo.needsFood.lunch || booking.guestInfo.needsFood.dinner) && (
                    <div className="mb-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <UtensilsIcon className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">खाना:</span>
                        <div className="flex space-x-2">
                          {booking.guestInfo.needsFood.breakfast && <Badge variant="outline" className="text-xs">बिहानको खाना</Badge>}
                          {booking.guestInfo.needsFood.lunch && <Badge variant="outline" className="text-xs">दिउँसोको खाना</Badge>}
                          {booking.guestInfo.needsFood.dinner && <Badge variant="outline" className="text-xs">बेलुकाको खाना</Badge>}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Special Requests */}
                  {booking.guestInfo.specialRequests && (
                    <div className="mb-3">
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">विशेष अनुरोध:</span>
                        <p className="text-gray-700 mt-1">{booking.guestInfo.specialRequests}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Dietary Requirements */}
                  {booking.guestInfo.dietaryRequirements && (
                    <div>
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">खाना सम्बन्धी आवश्यकता:</span>
                        <p className="text-gray-700 mt-1">{booking.guestInfo.dietaryRequirements}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
