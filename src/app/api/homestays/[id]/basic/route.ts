import { NextRequest, NextResponse } from "next/server";
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import HomestaySingle from '@/lib/models/HomestaySingle';
import Contact from '@/lib/models/Contact';
import Official from '@/lib/models/Official';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const homestayId = params.id;

  if (!homestayId) {
    return NextResponse.json({ error: 'Homestay ID is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    // 1. Fetch the homestay
    const homestay = await HomestaySingle.findOne({ homestayId });

    if (!homestay) {
      return NextResponse.json({ error: 'Homestay not found' }, { status: 404 });
    }

    // 2. Fetch contacts associated with this homestay
    let contacts = [];
    if (homestay.contactIds && homestay.contactIds.length > 0) {
      contacts = await Contact.find({
        _id: { $in: homestay.contactIds }
      });
    }

    // 3. Fetch officials associated with this homestay
    let officials = [];
    if (homestay.officialIds && homestay.officialIds.length > 0) {
      officials = await Official.find({
        _id: { $in: homestay.officialIds }
      });
    }

    return NextResponse.json({
      homestay,
      contacts,
      officials
    });
  } catch (error) {
    console.error('Error fetching homestay data:', error);
    return NextResponse.json({ error: 'Failed to fetch homestay data' }, { status: 500 });
  }
} 