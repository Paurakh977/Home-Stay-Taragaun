import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Contact from '@/lib/models/Contact';

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    await dbConnect();
    const { contactId } = params;

    if (!contactId) {
      return NextResponse.json(
        { success: false, message: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Find contact by ID
    const contact = await Contact.findById(contactId).lean();

    if (!contact) {
      return NextResponse.json(
        { success: false, message: 'Contact not found' },
        { status: 404 }
      );
    }

    // Return contact data
    return NextResponse.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json(
      { success: false, message: 'Failed to fetch contact', error: errorMessage },
      { status: 500 }
    );
  }
} 