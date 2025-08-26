'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Users, Home, Calendar, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { HomestayAvailability } from '@/types/booking';

interface AvailabilityToggleProps {
  homestayId: string;
  onAvailabilityChange?: (availability: HomestayAvailability) => void;
}

const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({
  homestayId,
  onAvailabilityChange
}) => {
  const [availability, setAvailability] = useState<HomestayAvailability>({
    homestayId,
    isAvailable: true,
    maxGuests: 10,
    maxRooms: 5,
    minimumStay: 1,
    advanceBookingDays: 365,
    lastUpdated: new Date().toISOString()
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability();
  }, [homestayId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/homestays/${homestayId}/availability`);
      const result = await response.json();

      if (result.success) {
        setAvailability(result.data);
      } else {
        setError(result.message || 'Failed to fetch availability');
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('An error occurred while fetching availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/homestays/${homestayId}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAvailable: availability.isAvailable,
          maxGuestsPerBooking: availability.maxGuests,
          maxRoomsPerBooking: availability.maxRooms,
          minimumStayNights: availability.minimumStay,
          advanceBookingDays: availability.advanceBookingDays
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAvailability(result.data);
        onAvailabilityChange?.(result.data);
        // Show success message (you could use a toast here)
        alert('Availability settings updated successfully!');
      } else {
        setError(result.message || 'Failed to update availability');
      }
    } catch (err) {
      console.error('Error updating availability:', err);
      setError('An error occurred while updating availability');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof HomestayAvailability, value: any) => {
    setAvailability(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Availability Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Availability Settings
        </CardTitle>
        <CardDescription>
          Manage your homestay's booking availability and restrictions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Main Availability Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Accept New Bookings</h3>
            <p className="text-sm text-gray-600">
              Turn this off to stop accepting new booking requests
            </p>
          </div>
          <Switch
            checked={availability.isAvailable}
            onCheckedChange={(checked) => handleInputChange('isAvailable', checked)}
          />
        </div>

        {/* Booking Limits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxGuests" className="flex items-center mb-2">
              <Users className="h-4 w-4 mr-1" />
              Maximum Guests per Booking
            </Label>
            <Input
              id="maxGuests"
              type="number"
              min="1"
              max="50"
              value={availability.maxGuests}
              onChange={(e) => handleInputChange('maxGuests', parseInt(e.target.value))}
              disabled={!availability.isAvailable}
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of guests allowed in a single booking
            </p>
          </div>

          <div>
            <Label htmlFor="maxRooms" className="flex items-center mb-2">
              <Home className="h-4 w-4 mr-1" />
              Maximum Rooms per Booking
            </Label>
            <Input
              id="maxRooms"
              type="number"
              min="1"
              max="20"
              value={availability.maxRooms}
              onChange={(e) => handleInputChange('maxRooms', parseInt(e.target.value))}
              disabled={!availability.isAvailable}
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of rooms that can be booked at once
            </p>
          </div>
        </div>

        {/* Stay Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="minimumStay" className="flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-1" />
              Minimum Stay (nights)
            </Label>
            <Input
              id="minimumStay"
              type="number"
              min="1"
              max="30"
              value={availability.minimumStay}
              onChange={(e) => handleInputChange('minimumStay', parseInt(e.target.value))}
              disabled={!availability.isAvailable}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum number of nights guests must book
            </p>
          </div>

          <div>
            <Label htmlFor="advanceBooking" className="flex items-center mb-2">
              <Clock className="h-4 w-4 mr-1" />
              Advance Booking Limit (days)
            </Label>
            <Input
              id="advanceBooking"
              type="number"
              min="1"
              max="730"
              value={availability.advanceBookingDays}
              onChange={(e) => handleInputChange('advanceBookingDays', parseInt(e.target.value))}
              disabled={!availability.isAvailable}
            />
            <p className="text-xs text-gray-500 mt-1">
              How far in advance guests can make bookings
            </p>
          </div>
        </div>

        {/* Current Status */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Current Status</h3>
          <div className="space-y-1 text-sm text-blue-800">
            <p>
              <strong>Accepting Bookings:</strong> {availability.isAvailable ? 'Yes' : 'No'}
            </p>
            {availability.isAvailable && (
              <>
                <p>
                  <strong>Max Capacity:</strong> {availability.maxGuests} guests, {availability.maxRooms} rooms
                </p>
                <p>
                  <strong>Minimum Stay:</strong> {availability.minimumStay} night{availability.minimumStay !== 1 ? 's' : ''}
                </p>
                <p>
                  <strong>Booking Window:</strong> Up to {availability.advanceBookingDays} days in advance
                </p>
              </>
            )}
            <p className="text-xs text-blue-600 mt-2">
              Last updated: {new Date(availability.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityToggle;
