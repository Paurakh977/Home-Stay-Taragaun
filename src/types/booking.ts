// Guest Information Types
export interface GuestInfo {
  name: string;
  email: string;
  phone: string;
  numberOfGuests: number;
  numberOfRooms: number;
  specialRequests?: string;
  dietaryRequirements?: string;
  arrivalTime?: string;
  needsFood?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
}

// Homestay Response Types
export interface HomestayResponse {
  respondedAt: Date | string;
  message?: string;
  estimatedCost?: number;
  currency?: string;
}

// Notification Tracking Types
export interface NotificationsSent {
  toHomestay: boolean;
  toGuest: boolean;
  confirmationSent: boolean;
}

// Main Booking Interface
export interface Booking {
  _id?: string;
  bookingId: string;
  homestayId: string;
  homestayName: string;
  clerkUserId: string;
  clerkUserEmail: string;
  clerkUserName: string;
  
  // Guest information
  guestInfo: GuestInfo;
  
  // Booking dates
  checkInDate: Date | string;
  checkOutDate: Date | string;
  numberOfNights: number;
  
  // Booking status
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  
  // Homestay response
  homestayResponse?: HomestayResponse;
  
  // Booking metadata
  totalGuests: number;
  totalRooms: number;
  bookingSource: 'website' | 'mobile' | 'admin';
  
  // Notification tracking
  notificationsSent: NotificationsSent;
  
  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
  confirmedAt?: Date | string;
  cancelledAt?: Date | string;
  completedAt?: Date | string;
}

// Booking Form Data (for creating new bookings)
export interface BookingFormData {
  homestayId: string;
  homestayName: string;
  guestInfo: {
    name: string;
    email: string;
    phone: string;
    numberOfGuests: number;
    numberOfRooms: number;
    specialRequests?: string;
    dietaryRequirements?: string;
    arrivalTime?: string;
    needsFood?: {
      breakfast: boolean;
      lunch: boolean;
      dinner: boolean;
    };
  };
  checkInDate: Date | string;
  checkOutDate: Date | string;
}

// Booking Update Data (for homestay responses)
export interface BookingUpdateData {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  homestayResponse?: {
    message?: string;
    estimatedCost?: number;
    currency?: string;
  };
}

// Booking Filter Options
export interface BookingFilters {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' | 'all';
  dateFrom?: Date | string;
  dateTo?: Date | string;
  homestayId?: string;
  clerkUserId?: string;
}

// Booking Statistics
export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  rejectedBookings: number;
  totalRevenue?: number;
  averageStayDuration?: number;
}

// Socket Event Types for Booking Notifications
export interface BookingNotificationData {
  bookingId: string;
  homestayId: string;
  homestayName: string;
  clerkUserId: string;
  clerkUserName: string;
  clerkUserEmail: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfRooms: number;
  status: string;
  message?: string;
  timestamp: string;
}

// Homestay Availability Types
export interface HomestayAvailability {
  homestayId: string;
  isAvailable: boolean;
  unavailableDates?: Date[] | string[];
  maxGuests?: number;
  maxRooms?: number;
  minimumStay?: number; // in nights
  advanceBookingDays?: number; // how many days in advance bookings are allowed
  lastUpdated: Date | string;
}

// API Response Types
export interface BookingApiResponse {
  success: boolean;
  message: string;
  data?: Booking;
  error?: string;
}

export interface BookingListApiResponse {
  success: boolean;
  message: string;
  data?: Booking[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface BookingStatsApiResponse {
  success: boolean;
  message: string;
  data?: BookingStats;
  error?: string;
}

// Booking Modal Props
export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  homestayId: string;
  homestayName: string;
  homestayImage?: string;
  maxGuests?: number;
  maxRooms?: number;
  isAvailable?: boolean;
}

// Booking Card Props
export interface BookingCardProps {
  booking: Booking;
  onStatusUpdate?: (bookingId: string, status: string, response?: HomestayResponse) => void;
  onViewDetails?: (booking: Booking) => void;
  showActions?: boolean;
}

// Booking List Props
export interface BookingListProps {
  bookings: Booking[];
  loading?: boolean;
  onStatusUpdate?: (bookingId: string, status: string, response?: HomestayResponse) => void;
  onRefresh?: () => void;
  filters?: BookingFilters;
  onFiltersChange?: (filters: BookingFilters) => void;
  showActions?: boolean;
}
