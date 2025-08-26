import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Booking, HomestaySingle } from '@/lib/models';
import { getAuth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';
import { jwtVerify } from 'jose';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});
import { v4 as uuidv4 } from 'uuid';
import { publishNewBookingNotification } from '@/lib/redis';
import type { BookingFormData } from '@/types/booking';
import type { RedisBookingNotification } from '@/lib/redis';

// JWT secret for homestay authentication
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

// Helper function to get authentication data from both Clerk and JWT
async function getAuthData(req: NextApiRequest): Promise<{ userId: string; userType: 'clerk' | 'homestay' } | null> {
  // Try Clerk authentication first
  const { userId: clerkUserId } = getAuth(req);
  if (clerkUserId) {
    return { userId: clerkUserId, userType: 'clerk' };
  }

  // Try JWT authentication (homestay users)
  const authToken = req.cookies.auth_token;
  if (authToken) {
    try {
      const { payload } = await jwtVerify(authToken, JWT_SECRET);
      const homestayId = (payload as any).homestayId;
      if (homestayId) {
        return { userId: homestayId, userType: 'homestay' };
      }
    } catch (error) {
      console.error('📋 JWT verification failed:', error);
    }
  }

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  switch (req.method) {
    case 'POST':
      return createBooking(req, res);
    case 'GET':
      return getBookings(req, res);
    default:
      return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

// Create a new booking
async function createBooking(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get authenticated user from Clerk
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const bookingData: BookingFormData = req.body;

    // Validate required fields
    if (!bookingData.homestayId || !bookingData.guestInfo || !bookingData.checkInDate || !bookingData.checkOutDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: homestayId, guestInfo, checkInDate, checkOutDate' 
      });
    }

    // Validate dates
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return res.status(400).json({ 
        success: false, 
        message: 'Check-in date cannot be in the past' 
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({ 
        success: false, 
        message: 'Check-out date must be after check-in date' 
      });
    }

    // Verify homestay exists and is available
    let homestay;

    // First try to find by homestayId field
    homestay = await HomestaySingle.findOne({ homestayId: bookingData.homestayId }).select('homestayId homeStayName availability latitude longitude');

    // If not found and the ID looks like a MongoDB ObjectId, try _id
    if (!homestay && bookingData.homestayId.match(/^[0-9a-fA-F]{24}$/)) {
      homestay = await HomestaySingle.findById(bookingData.homestayId).select('homestayId homeStayName availability latitude longitude');
    }

    if (!homestay) {
      return res.status(404).json({ success: false, message: 'Homestay not found' });
    }

    // Check availability
    if (homestay.availability?.isAvailable === false) {
      return res.status(400).json({ 
        success: false, 
        message: 'This homestay is currently not accepting bookings' 
      });
    }

    // Calculate number of nights
    const numberOfNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));

    // Create booking
    const bookingId = `BK-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const booking = new Booking({
      bookingId,
      homestayId: homestay.homestayId || homestay._id,
      homestayName: homestay.homeStayName,
      clerkUserId: userId,
      clerkUserEmail: user.emailAddresses[0]?.emailAddress || '',
      clerkUserName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Guest',
      guestInfo: bookingData.guestInfo,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfNights: numberOfNights,
      totalGuests: bookingData.guestInfo.numberOfGuests,
      totalRooms: bookingData.guestInfo.numberOfRooms,
      status: 'pending',
      bookingSource: 'website',
      notificationsSent: {
        toHomestay: false,
        toGuest: false,
        confirmationSent: false
      }
    });

    await booking.save();

    // Add booking reference to homestay
    await HomestaySingle.findByIdAndUpdate(
      homestay._id,
      { $push: { bookings: booking._id } }
    );

    // Send real-time notification to homestay
    try {
      const notificationData: RedisBookingNotification = {
        bookingId: booking.bookingId,
        homestayId: booking.homestayId,
        homestayName: booking.homestayName,
        clerkUserId: booking.clerkUserId,
        clerkUserName: booking.clerkUserName,
        clerkUserEmail: booking.clerkUserEmail,
        guestName: booking.guestInfo.name,
        checkInDate: booking.checkInDate.toISOString(),
        checkOutDate: booking.checkOutDate.toISOString(),
        numberOfGuests: booking.guestInfo.numberOfGuests,
        numberOfRooms: booking.guestInfo.numberOfRooms,
        status: booking.status,
        timestamp: new Date().toISOString()
      };

      await publishNewBookingNotification(notificationData);
      console.log('📋 Published booking notification for:', booking.bookingId);
    } catch (notificationError) {
      console.error('❌ Failed to send booking notification:', notificationError);
      // Don't fail the booking creation if notification fails
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        ...booking.toObject(),
        homestayCoordinates: {
          latitude: homestay.latitude,
          longitude: homestay.longitude
        }
      }
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
}

// Get bookings with filters
async function getBookings(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authData = await getAuthData(req);

    const {
      homestayId,
      clerkUserId,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10
    } = req.query as any;

    console.log('📋 Bookings API - GET request received with params:', {
      homestayId, clerkUserId, status, page, limit, dateFrom, dateTo, authData
    });

    // Build filter query
    const filter: any = {};

    // If user is authenticated, they can see their own bookings
    // If homestayId is provided, check if user owns that homestay
    if (homestayId) {
      filter.homestayId = homestayId;

      // Verify homestay ownership if user is authenticated
      if (authData) {
        let homestay;

        // First try to find by homestayId field
        homestay = await HomestaySingle.findOne({ homestayId: homestayId });

        // If not found and the ID looks like a MongoDB ObjectId, try _id
        if (!homestay && homestayId.match(/^[0-9a-fA-F]{24}$/)) {
          homestay = await HomestaySingle.findById(homestayId);
        }
        
        if (!homestay) {
          return res.status(404).json({ success: false, message: 'Homestay not found' });
        }

        // For homestay users, verify they own the homestay
        if (authData.userType === 'homestay' && homestay.homestayId !== authData.userId) {
          return res.status(403).json({ success: false, message: 'Access denied - not your homestay' });
        }
      }
    } else if (clerkUserId) {
      filter.clerkUserId = clerkUserId;

      // Users can only see their own bookings unless they're admin
      if (authData && authData.userType === 'clerk' && authData.userId !== clerkUserId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    } else if (authData) {
      // If no specific filter, show user's own bookings
      if (authData.userType === 'clerk') {
        filter.clerkUserId = authData.userId;
      } else if (authData.userType === 'homestay') {
        filter.homestayId = authData.userId;
      }
    } else {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (dateFrom || dateTo) {
      filter.checkInDate = {};
      if (dateFrom) filter.checkInDate.$gte = new Date(dateFrom);
      if (dateTo) filter.checkInDate.$lte = new Date(dateTo);
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    console.log('📋 Bookings API - Filter query:', filter);

    // Get bookings
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Booking.countDocuments(filter);

    console.log('📋 Bookings API - Found bookings:', bookings.length, 'total:', total);
    console.log('📋 Bookings API - Bookings data:', bookings);

    return res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
}
