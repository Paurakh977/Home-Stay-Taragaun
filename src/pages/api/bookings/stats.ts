import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Booking, HomestaySingle } from '@/lib/models';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  return getBookingStats(req, res);
}

async function getBookingStats(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = getAuth(req);
    const { homestayId } = req.query;
    const homestayIdString = Array.isArray(homestayId) ? homestayId[0] : homestayId;

    // Build filter based on user and homestay
    const filter: any = {};

    if (homestayIdString) {
      filter.homestayId = homestayIdString;

      // Verify homestay ownership if user is authenticated
      if (userId) {
        const homestay = await HomestaySingle.findOne({
          $or: [
            { homestayId: homestayIdString },
            { _id: homestayIdString }
          ]
        });
        
        if (!homestay) {
          return res.status(404).json({ success: false, message: 'Homestay not found' });
        }
        
        // For now, allow access - in production verify ownership
      }
    } else if (userId) {
      // If no homestayId specified, show stats for user's bookings
      filter.clerkUserId = userId;
    } else {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Get basic counts
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      rejectedBookings
    ] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.countDocuments({ ...filter, status: 'pending' }),
      Booking.countDocuments({ ...filter, status: 'confirmed' }),
      Booking.countDocuments({ ...filter, status: 'cancelled' }),
      Booking.countDocuments({ ...filter, status: 'completed' }),
      Booking.countDocuments({ ...filter, status: 'rejected' })
    ]);

    // Calculate average stay duration
    const bookingsWithDuration = await Booking.find(filter)
      .select('numberOfNights')
      .lean();

    const averageStayDuration = bookingsWithDuration.length > 0
      ? bookingsWithDuration.reduce((sum, booking) => sum + booking.numberOfNights, 0) / bookingsWithDuration.length
      : 0;

    // Get recent bookings for additional insights
    const recentBookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('bookingId homestayName guestInfo.name status createdAt numberOfNights')
      .lean();

    // Calculate monthly booking trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Booking.aggregate([
      {
        $match: {
          ...filter,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalNights: { $sum: '$numberOfNights' },
          totalGuests: { $sum: '$totalGuests' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const stats = {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      rejectedBookings,
      averageStayDuration: Math.round(averageStayDuration * 10) / 10, // Round to 1 decimal
      recentBookings,
      monthlyTrends,
      lastUpdated: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Booking statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Error fetching booking stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
}
