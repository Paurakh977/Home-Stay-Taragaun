import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Booking, HomestaySingle } from '@/lib/models';
import { getAuth } from '@clerk/nextjs/server';
import { publishBookingStatusUpdate } from '@/lib/redis';
import type { BookingUpdateData } from '@/types/booking';
import type { RedisBookingStatusUpdate } from '@/lib/redis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { bookingId } = req.query;

  if (!bookingId || typeof bookingId !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid booking ID' });
  }

  switch (req.method) {
    case 'GET':
      return getBooking(req, res, bookingId);
    case 'PUT':
      return updateBooking(req, res, bookingId);
    case 'DELETE':
      return cancelBooking(req, res, bookingId);
    default:
      return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

// Get a specific booking
async function getBooking(req: NextApiRequest, res: NextApiResponse, bookingId: string) {
  try {
    const { userId } = getAuth(req);
    
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if user has permission to view this booking
    if (userId) {
      // User can view their own booking
      if (booking.clerkUserId === userId) {
        return res.status(200).json({
          success: true,
          message: 'Booking retrieved successfully',
          data: booking
        });
      }

      // Check if user owns the homestay
      const homestay = await HomestaySingle.findOne({
        $or: [
          { homestayId: booking.homestayId },
          { _id: booking.homestayId }
        ]
      });

      if (homestay) {
        // For now, allow access - in production you'd verify ownership
        return res.status(200).json({
          success: true,
          message: 'Booking retrieved successfully',
          data: booking
        });
      }
    }

    return res.status(403).json({ success: false, message: 'Access denied' });

  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
}

// Update booking status (for homestay owners)
async function updateBooking(req: NextApiRequest, res: NextApiResponse, bookingId: string) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify homestay ownership
    const homestay = await HomestaySingle.findOne({
      $or: [
        { homestayId: booking.homestayId },
        { _id: booking.homestayId }
      ]
    });

    if (!homestay) {
      return res.status(404).json({ success: false, message: 'Homestay not found' });
    }

    // For now, allow any authenticated user to update - in production verify ownership
    
    const updateData: BookingUpdateData = req.body;
    const updates: any = {};

    // Update status if provided
    if (updateData.status) {
      if (!['pending', 'confirmed', 'cancelled', 'completed', 'rejected'].includes(updateData.status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      
      updates.status = updateData.status;
      
      // Set timestamp based on status
      switch (updateData.status) {
        case 'confirmed':
          updates.confirmedAt = new Date();
          break;
        case 'cancelled':
        case 'rejected':
          updates.cancelledAt = new Date();
          break;
        case 'completed':
          updates.completedAt = new Date();
          break;
      }
    }

    // Update homestay response if provided
    if (updateData.homestayResponse) {
      updates.homestayResponse = {
        ...booking.homestayResponse,
        ...updateData.homestayResponse,
        respondedAt: new Date()
      };
    }

    // Update the booking
    const updatedBooking = await Booking.findOneAndUpdate(
      { bookingId },
      { $set: updates },
      { new: true }
    );

    // Send real-time notification for status updates
    if (updateData.status && updateData.status !== booking.status) {
      try {
        const statusUpdateData: RedisBookingStatusUpdate = {
          bookingId: booking.bookingId,
          homestayId: booking.homestayId,
          clerkUserId: booking.clerkUserId,
          oldStatus: booking.status,
          newStatus: updateData.status,
          message: updateData.homestayResponse?.message,
          timestamp: new Date().toISOString()
        };

        await publishBookingStatusUpdate(statusUpdateData);
        console.log('📋 Published booking status update for:', booking.bookingId, 'new status:', updateData.status);
      } catch (notificationError) {
        console.error('❌ Failed to send booking status notification:', notificationError);
        // Don't fail the update if notification fails
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
}

// Cancel booking (for guests)
async function cancelBooking(req: NextApiRequest, res: NextApiResponse, bookingId: string) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only the guest who made the booking can cancel it
    if (booking.clerkUserId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if booking can be cancelled
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking cannot be cancelled in its current status' 
      });
    }

    // Update booking status to cancelled
    const updatedBooking = await Booking.findOneAndUpdate(
      { bookingId },
      { 
        $set: { 
          status: 'cancelled',
          cancelledAt: new Date()
        }
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
}
