import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { HomestaySingle } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid homestay ID' });
  }

  switch (req.method) {
    case 'GET':
      return getAvailability(req, res, id);
    case 'PUT':
      return updateAvailability(req, res, id);
    default:
      return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

// Get homestay availability
async function getAvailability(req: NextApiRequest, res: NextApiResponse, homestayId: string) {
  try {
    // Try to find by homestayId first, then by _id if it's a valid ObjectId
    let homestay;

    // First try to find by homestayId field
    homestay = await HomestaySingle.findOne({ homestayId: homestayId }).select('availability homeStayName');

    // If not found and the ID looks like a MongoDB ObjectId, try _id
    if (!homestay && homestayId.match(/^[0-9a-fA-F]{24}$/)) {
      homestay = await HomestaySingle.findById(homestayId).select('availability homeStayName');
    }

    if (!homestay) {
      return res.status(404).json({ success: false, message: 'Homestay not found' });
    }

    const availability = {
      homestayId: homestay.homestayId || homestay._id,
      homestayName: homestay.homeStayName,
      isAvailable: homestay.availability?.isAvailable ?? true,
      lastUpdated: homestay.updatedAt
    };

    return res.status(200).json({
      success: true,
      message: 'Availability retrieved successfully',
      data: availability
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
}

// Update homestay availability
async function updateAvailability(req: NextApiRequest, res: NextApiResponse, homestayId: string) {
  try {
    // For now, allow any request - in production, verify homestay ownership

    // Try to find by homestayId first, then by _id if it's a valid ObjectId
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

    const {
      isAvailable,
      maxGuestsPerBooking,
      maxRoomsPerBooking,
      minimumStayNights,
      advanceBookingDays,
      bookedDates
    } = req.body;

    // Validate input
    const updates: any = {};

    if (typeof isAvailable === 'boolean') {
      updates['availability.isAvailable'] = isAvailable;
    }

    if (maxGuestsPerBooking && typeof maxGuestsPerBooking === 'number' && maxGuestsPerBooking > 0) {
      updates['availability.maxGuestsPerBooking'] = maxGuestsPerBooking;
    }

    if (maxRoomsPerBooking && typeof maxRoomsPerBooking === 'number' && maxRoomsPerBooking > 0) {
      updates['availability.maxRoomsPerBooking'] = maxRoomsPerBooking;
    }

    if (minimumStayNights && typeof minimumStayNights === 'number' && minimumStayNights > 0) {
      updates['availability.minimumStayNights'] = minimumStayNights;
    }

    if (advanceBookingDays && typeof advanceBookingDays === 'number' && advanceBookingDays > 0) {
      updates['availability.advanceBookingDays'] = advanceBookingDays;
    }

    if (bookedDates && Array.isArray(bookedDates)) {
      // Validate dates
      const validDates = bookedDates.filter(date => {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d.getTime());
      });
      updates['availability.bookedDates'] = validDates;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid updates provided' });
    }

    // Update the homestay
    const updatedHomestay = await HomestaySingle.findByIdAndUpdate(
      homestay._id,
      { $set: updates },
      { new: true }
    ).select('availability homeStayName');

    if (!updatedHomestay) {
      return res.status(404).json({ success: false, message: 'Homestay not found after update' });
    }

    const availability = {
      homestayId: updatedHomestay.homestayId || updatedHomestay._id,
      homestayName: updatedHomestay.homeStayName,
      isAvailable: updatedHomestay.availability?.isAvailable ?? true,
      lastUpdated: updatedHomestay.updatedAt
    };

    return res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      data: availability
    });

  } catch (error) {
    console.error('Error updating availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
  }
}
