import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import HomestaySingle from "@/lib/models/HomestaySingle";

// Define the old and new username values
const OLD_USERNAME = "taragaun";
const NEW_USERNAME = "taragaon";

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    
    // Track migration stats
    const results = {
      userUpdated: false,
      totalHomestays: 0,
      updatedHomestays: 0,
      details: {
        user: null as any,
        homestays: [] as Array<{
          homestayId: string;
          updated: boolean;
        }>
      }
    };
    
    // 1. Update the User record
    const user = await User.findOne({ username: OLD_USERNAME });
    
    if (user) {
      console.log(`Found user with username: ${OLD_USERNAME}`);
      
      // Store original user data for reporting
      results.details.user = {
        id: user._id,
        oldUsername: user.username,
        newUsername: NEW_USERNAME
      };
      
      // Update the username
      user.username = NEW_USERNAME;
      await user.save();
      
      results.userUpdated = true;
      console.log(`Updated user username from ${OLD_USERNAME} to ${NEW_USERNAME}`);
    } else {
      console.log(`No user found with username: ${OLD_USERNAME}`);
    }
    
    // 2. Update all homestays associated with this admin
    const homestays = await HomestaySingle.find({ adminUsername: OLD_USERNAME });
    
    results.totalHomestays = homestays.length;
    console.log(`Found ${homestays.length} homestays with adminUsername: ${OLD_USERNAME}`);
    
    // Update each homestay
    for (const homestay of homestays) {
      // Add to results
      results.details.homestays.push({
        homestayId: homestay.homestayId,
        updated: true
      });
      
      // Update the adminUsername
      homestay.adminUsername = NEW_USERNAME;
      await homestay.save();
      
      results.updatedHomestays++;
      console.log(`Updated adminUsername for homestay: ${homestay.homestayId}`);
    }
    
    console.log(`Migration complete. Updated ${results.userUpdated ? '1' : '0'} user and ${results.updatedHomestays} homestays.`);
    
    return NextResponse.json({
      success: true,
      message: `Migration complete. Updated ${results.userUpdated ? '1' : '0'} user and ${results.updatedHomestays} out of ${results.totalHomestays} homestays.`,
      results
    });
    
  } catch (error) {
    console.error('Error during admin username migration:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
} 