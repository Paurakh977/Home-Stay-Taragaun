'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Home, Clock, Utensils, MessageSquare, MapPin } from 'lucide-react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { BookingModalProps, BookingFormData } from '@/types/booking';

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  homestayId,
  homestayName,
  homestayImage,
  maxGuests = 10,
  maxRooms = 5,
  isAvailable = true
}) => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>({
    homestayId,
    homestayName,
    guestInfo: {
      name: '',
      email: '',
      phone: '',
      numberOfGuests: 2,
      numberOfRooms: 1,
      specialRequests: '',
      dietaryRequirements: '',
      arrivalTime: '',
      needsFood: {
        breakfast: false,
        lunch: false,
        dinner: false
      }
    },
    checkInDate: '',
    checkOutDate: ''
  });

  // Pre-fill user data when modal opens
  useEffect(() => {
    if (isSignedIn && user && isOpen) {
      setFormData(prev => ({
        ...prev,
        guestInfo: {
          ...prev.guestInfo,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || '',
          email: user.emailAddresses[0]?.emailAddress || ''
        }
      }));
    }
  }, [isSignedIn, user, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormData(prev => ({
        ...prev,
        guestInfo: {
          ...prev.guestInfo,
          specialRequests: '',
          dietaryRequirements: '',
          arrivalTime: '',
          needsFood: {
            breakfast: false,
            lunch: false,
            dinner: false
          }
        },
        checkInDate: '',
        checkOutDate: ''
      }));
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('guestInfo.')) {
      const guestField = field.replace('guestInfo.', '');
      if (guestField.startsWith('needsFood.')) {
        const foodField = guestField.replace('needsFood.', '');
        setFormData(prev => ({
          ...prev,
          guestInfo: {
            ...prev.guestInfo,
            needsFood: {
              breakfast: prev.guestInfo.needsFood?.breakfast ?? false,
              lunch: prev.guestInfo.needsFood?.lunch ?? false,
              dinner: prev.guestInfo.needsFood?.dinner ?? false,
              [foodField]: Boolean(value)
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          guestInfo: {
            ...prev.guestInfo,
            [guestField]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateStep1 = () => {
    const { checkInDate, checkOutDate, guestInfo } = formData;
    return checkInDate && checkOutDate && 
           guestInfo.numberOfGuests > 0 && 
           guestInfo.numberOfRooms > 0 &&
           new Date(checkOutDate) > new Date(checkInDate);
  };

  const validateStep2 = () => {
    const { guestInfo } = formData;
    return guestInfo.name.trim() && 
           guestInfo.email.trim() && 
           guestInfo.phone.trim();
  };

  const calculateNights = () => {
    if (formData.checkInDate && formData.checkOutDate) {
      const checkIn = new Date(formData.checkInDate);
      const checkOut = new Date(formData.checkOutDate);
      const timeDiff = checkOut.getTime() - checkIn.getTime();
      return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
    return 0;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to success page
        window.location.href = `/booking-success?bookingId=${result.data.bookingId}`;
      } else {
        alert(result.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('An error occurred while creating your booking');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (!isAvailable) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Booking Unavailable</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            This homestay is currently not accepting bookings. Please try again later or contact the homestay directly.
          </p>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Book Your Stay</h2>
              <p className="text-gray-600">{homestayName}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center mt-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <Calendar className="mr-2" size={20} />
                Select Dates & Guests
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkIn">Check-in Date</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={typeof formData.checkInDate === 'string' ? formData.checkInDate : formData.checkInDate.toISOString().split('T')[0]}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="checkOut">Check-out Date</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={typeof formData.checkOutDate === 'string' ? formData.checkOutDate : formData.checkOutDate.toISOString().split('T')[0]}
                    min={typeof formData.checkInDate === 'string' ? formData.checkInDate : formData.checkInDate.toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              {calculateNights() > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    {calculateNights()} night{calculateNights() !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guests">Number of Guests</Label>
                  <Input
                    id="guests"
                    type="number"
                    min="1"
                    max={maxGuests}
                    value={formData.guestInfo.numberOfGuests}
                    onChange={(e) => handleInputChange('guestInfo.numberOfGuests', parseInt(e.target.value))}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Maximum {maxGuests} guests</p>
                </div>
                <div>
                  <Label htmlFor="rooms">Number of Rooms</Label>
                  <Input
                    id="rooms"
                    type="number"
                    min="1"
                    max={maxRooms}
                    value={formData.guestInfo.numberOfRooms}
                    onChange={(e) => handleInputChange('guestInfo.numberOfRooms', parseInt(e.target.value))}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Maximum {maxRooms} rooms</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!validateStep1()}
                  className="px-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <Users className="mr-2" size={20} />
                Guest Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.guestInfo.name}
                    onChange={(e) => handleInputChange('guestInfo.name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.guestInfo.email}
                    onChange={(e) => handleInputChange('guestInfo.email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.guestInfo.phone}
                  onChange={(e) => handleInputChange('guestInfo.phone', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="arrivalTime">Expected Arrival Time (Optional)</Label>
                <Input
                  id="arrivalTime"
                  type="time"
                  value={formData.guestInfo.arrivalTime}
                  onChange={(e) => handleInputChange('guestInfo.arrivalTime', e.target.value)}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!validateStep2()}
                  className="px-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <MessageSquare className="mr-2" size={20} />
                Additional Preferences
              </h3>
              
              <div>
                <Label>Food Services Needed</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="breakfast"
                      checked={formData.guestInfo.needsFood?.breakfast}
                      onCheckedChange={(checked) => handleInputChange('guestInfo.needsFood.breakfast', checked)}
                    />
                    <Label htmlFor="breakfast">Breakfast</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lunch"
                      checked={formData.guestInfo.needsFood?.lunch}
                      onCheckedChange={(checked) => handleInputChange('guestInfo.needsFood.lunch', checked)}
                    />
                    <Label htmlFor="lunch">Lunch</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dinner"
                      checked={formData.guestInfo.needsFood?.dinner}
                      onCheckedChange={(checked) => handleInputChange('guestInfo.needsFood.dinner', checked)}
                    />
                    <Label htmlFor="dinner">Dinner</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="dietary">Dietary Requirements (Optional)</Label>
                <Textarea
                  id="dietary"
                  value={formData.guestInfo.dietaryRequirements}
                  onChange={(e) => handleInputChange('guestInfo.dietaryRequirements', e.target.value)}
                  placeholder="Please mention any dietary restrictions, allergies, or special requirements..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="requests">Special Requests (Optional)</Label>
                <Textarea
                  id="requests"
                  value={formData.guestInfo.specialRequests}
                  onChange={(e) => handleInputChange('guestInfo.specialRequests', e.target.value)}
                  placeholder="Any special requests or additional information..."
                  rows={3}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Homestay:</strong> {homestayName}</p>
                  <p><strong>Dates:</strong> {typeof formData.checkInDate === 'string' ? formData.checkInDate : formData.checkInDate.toISOString().split('T')[0]} to {typeof formData.checkOutDate === 'string' ? formData.checkOutDate : formData.checkOutDate.toISOString().split('T')[0]}</p>
                  <p><strong>Duration:</strong> {calculateNights()} night{calculateNights() !== 1 ? 's' : ''}</p>
                  <p><strong>Guests:</strong> {formData.guestInfo.numberOfGuests}</p>
                  <p><strong>Rooms:</strong> {formData.guestInfo.numberOfRooms}</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="px-8"
                >
                  {loading ? 'Creating Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
