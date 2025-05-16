import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    
    console.log('[Migration] Starting update of registration fields...');
    
    // Track migration stats
    const results = {
      totalHomestays: 0,
      updatedHomestays: 0,
      details: [] as Array<{
        homestayId: string,
        updated: boolean
      }>
    };
    
    // Find all homestays first
    const allHomestays = await HomestaySingle.find({});
    results.totalHomestays = allHomestays.length;
    
    console.log(`Found ${allHomestays.length} homestays. Applying migration...`);
    
    // Update each homestay one by one to ensure compatibility
    for (const homestay of allHomestays) {
      // Force set the new fields regardless of existing values
      homestay.registrationAuthority = "";
      homestay.businessRegistrationNumber = "";
      await homestay.save();
      
      results.updatedHomestays++;
      results.details.push({
        homestayId: homestay.homestayId,
        updated: true
      });
    }
    
    console.log(`Migration complete. Force updated all ${results.totalHomestays} homestays with registration fields.`);
    
    return NextResponse.json({
      success: true,
      message: `Migration complete. Updated ${results.updatedHomestays} out of ${results.totalHomestays} homestays with registration fields.`,
      results
    });
    
  } catch (error) {
    console.error('[Migration] Error updating registration fields:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
} 