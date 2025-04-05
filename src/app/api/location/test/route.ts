import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { HomestaySingle, Location } from "@/lib/models";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Count locations
    const locationCount = await Location.countDocuments();
    
    // Get a sample location
    const sampleLocation = await Location.findOne();

    // Check model structure
    const locationSchema = mongoose.model('Location').schema;
    const schemaFields = Object.keys(locationSchema.paths);

    // Create test location
    const testLocation = {
      homestayId: "TEST-" + Date.now(),
      province: { ne: "लुम्बिनी", en: "Lumbini" },
      district: { ne: "रुपन्देही", en: "Rupandehi" },
      municipality: { ne: "सिद्धार्थनगर नगरपालिका", en: "Siddharthanagar Municipality" },
      ward: { ne: "१२", en: "12" },
      city: { ne: "भैरहवा", en: "Bhairahawa" },
      tole: { ne: "मिलनचोक", en: "Milan Chowk" },
      formattedAddress: { 
        ne: "मिलनचोक, भैरहवा, १२, सिद्धार्थनगर नगरपालिका, रुपन्देही, लुम्बिनी", 
        en: "Milan Chowk, Bhairahawa, 12, Siddharthanagar Municipality, Rupandehi, Lumbini" 
      },
      coordinates: [83.46112060546875, 27.5111198425293],
      isVerified: true
    };
    
    // Test validation
    let validationResult = null;
    let createdLocation = null;
    
    try {
      const model = new Location(testLocation);
      await model.validate();
      validationResult = "Location validates successfully!";
      
      // Only create if it doesn't exist already
      const existing = await Location.findOne({ homestayId: testLocation.homestayId });
      if (!existing) {
        createdLocation = await Location.create(testLocation);
      } else {
        createdLocation = existing;
      }
    } catch (error) {
      validationResult = "Validation error: " + (error instanceof Error ? error.message : String(error));
    }

    // Also test homestay schema
    let homestayValidation = null;
    const testHomestay = {
      homestayId: "TEST-" + Date.now(),
      name: "Test Homestay",
      address: {
        province: { ne: "लुम्बिनी", en: "Lumbini" },
        district: { ne: "रुपन्देही", en: "Rupandehi" },
        municipality: { ne: "सिद्धार्थनगर नगरपालिका", en: "Siddharthanagar Municipality" },
        ward: { ne: "१२", en: "12" }
      }
    };
    
    try {
      const model = new HomestaySingle(testHomestay);
      await model.validate();
      homestayValidation = "Homestay validates successfully!";
    } catch (error) {
      homestayValidation = "Homestay validation error: " + (error instanceof Error ? error.message : String(error));
    }

    return NextResponse.json({
      status: "success",
      message: "Location test successful",
      data: {
        locationCount,
        sampleLocation,
        schemaFields,
        validationResult,
        createdLocation,
        homestayValidation
      }
    });
  } catch (error) {
    console.error("Location test error:", error);
    return NextResponse.json(
      { 
        status: "error",
        message: error instanceof Error ? error.message : "An error occurred during location test",
      },
      { status: 500 }
    );
  }
} 