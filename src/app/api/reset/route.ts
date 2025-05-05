import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import mongoose from 'mongoose';

// Helper function to drop a collection safely
async function safeDropCollection(collectionName: string): Promise<string> {
  try {
    // Ensure database connection exists
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error("Database connection not established");
    }
    
    // Check if the collection exists first
    const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();
    if (collections.length > 0) {
      await mongoose.connection.db.dropCollection(collectionName);
      return `${collectionName} was successfully reset`;
    } else {
      return `${collectionName} doesn't exist, no need to reset`;
    }
  } catch (error: any) {
    if (error.code === 26) {
      return `${collectionName} doesn't exist, no need to reset`;
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    // First establish connection
    await dbConnect();
    
    // Ensure connection is established
    if (!mongoose.connection || !mongoose.connection.db) {
      throw new Error("Database connection not established");
    }
    
    // Force clear existing models
    try {
      if (mongoose.models.HomestaySingle) {
        delete mongoose.models.HomestaySingle;
      }
      if (mongoose.models.Location) {
        delete mongoose.models.Location;
      }
      if (mongoose.models.Official) {
        delete mongoose.models.Official;
      }
      if (mongoose.models.Contact) {
        delete mongoose.models.Contact;
      }
    } catch (error) {
      console.warn('Failed to clear models:', error);
    }
    
    // Get collections to reset
    const results = [];
    
    // Reset main collections
    results.push(await safeDropCollection('Homestays Collection'));
    results.push(await safeDropCollection('HomestayLocations'));
    results.push(await safeDropCollection('Officials'));
    results.push(await safeDropCollection('Contacts'));
    
    return NextResponse.json({ 
      success: true, 
      message: "Database reset completed successfully",
      details: results
    });
  } catch (error: any) {
    console.error("Error resetting database:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || "An error occurred while resetting the database"
    }, { status: 500 });
  }
} 