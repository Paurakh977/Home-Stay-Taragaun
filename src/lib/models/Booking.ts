import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Interface for Guest Information
interface IGuestInfo {
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

// Interface for Booking data
export interface IBooking extends Document {
  bookingId: string; // Unique booking identifier
  homestayId: string; // Reference to homestay
  homestayName: string; // Cached homestay name for quick access
  clerkUserId: string; // Clerk user ID who made the booking
  clerkUserEmail: string; // Cached clerk user email
  clerkUserName: string; // Cached clerk user name
  
  // Guest information
  guestInfo: IGuestInfo;
  
  // Booking dates
  checkInDate: Date;
  checkOutDate: Date;
  numberOfNights: number;
  
  // Booking status
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  
  // Homestay response
  homestayResponse?: {
    respondedAt: Date;
    message?: string;
    estimatedCost?: number;
    currency?: string;
  };
  
  // Booking metadata
  totalGuests: number;
  totalRooms: number;
  bookingSource: 'website' | 'mobile' | 'admin';
  
  // Notification tracking
  notificationsSent: {
    toHomestay: boolean;
    toGuest: boolean;
    confirmationSent: boolean;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  completedAt?: Date;
}

// Define the booking schema
const bookingSchema = new Schema<IBooking>(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    homestayId: {
      type: String,
      required: true,
      index: true
    },
    homestayName: {
      type: String,
      required: true
    },
    clerkUserId: {
      type: String,
      required: true,
      index: true
    },
    clerkUserEmail: {
      type: String,
      required: true
    },
    clerkUserName: {
      type: String,
      required: true
    },
    
    // Guest information
    guestInfo: {
      name: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      },
      numberOfGuests: {
        type: Number,
        required: true,
        min: 1
      },
      numberOfRooms: {
        type: Number,
        required: true,
        min: 1
      },
      specialRequests: {
        type: String,
        default: ""
      },
      dietaryRequirements: {
        type: String,
        default: ""
      },
      arrivalTime: {
        type: String,
        default: ""
      },
      needsFood: {
        breakfast: {
          type: Boolean,
          default: false
        },
        lunch: {
          type: Boolean,
          default: false
        },
        dinner: {
          type: Boolean,
          default: false
        }
      }
    },
    
    // Booking dates
    checkInDate: {
      type: Date,
      required: true,
      index: true
    },
    checkOutDate: {
      type: Date,
      required: true,
      index: true
    },
    numberOfNights: {
      type: Number,
      required: true,
      min: 1
    },
    
    // Booking status
    status: {
      type: String,
      required: true,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'],
      default: 'pending',
      index: true
    },
    
    // Homestay response
    homestayResponse: {
      respondedAt: Date,
      message: String,
      estimatedCost: Number,
      currency: {
        type: String,
        default: 'NPR'
      }
    },
    
    // Booking metadata
    totalGuests: {
      type: Number,
      required: true
    },
    totalRooms: {
      type: Number,
      required: true
    },
    bookingSource: {
      type: String,
      enum: ['website', 'mobile', 'admin'],
      default: 'website'
    },
    
    // Notification tracking
    notificationsSent: {
      toHomestay: {
        type: Boolean,
        default: false
      },
      toGuest: {
        type: Boolean,
        default: false
      },
      confirmationSent: {
        type: Boolean,
        default: false
      }
    },
    
    // Additional timestamps
    confirmedAt: Date,
    cancelledAt: Date,
    completedAt: Date
  },
  {
    timestamps: true,
    collection: 'Bookings'
  }
);

// Compound indexes for efficient queries
bookingSchema.index({ homestayId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ clerkUserId: 1, createdAt: -1 });
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to calculate numberOfNights and totalGuests/totalRooms
bookingSchema.pre('save', function(next) {
  // Calculate number of nights
  if (this.checkInDate && this.checkOutDate) {
    const timeDiff = this.checkOutDate.getTime() - this.checkInDate.getTime();
    this.numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  
  // Set total guests and rooms from guestInfo
  if (this.guestInfo) {
    this.totalGuests = this.guestInfo.numberOfGuests;
    this.totalRooms = this.guestInfo.numberOfRooms;
  }
  
  next();
});

const Booking = (models?.Booking as Model<IBooking>) || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
