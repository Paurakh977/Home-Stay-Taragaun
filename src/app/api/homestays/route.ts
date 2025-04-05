import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { HomestaySingle, Official, Contact } from "@/lib/models";
import { generateHomestayId, generateSecurePassword, hashPassword } from "@/lib/utils";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const province = searchParams.get("province");
    const district = searchParams.get("district");
    const query = searchParams.get("q");
    
    // Build filter
    const filter: any = {};
    if (province) filter["address.province"] = province;
    if (district) filter["address.district"] = district;
    if (query) {
      filter.$text = { $search: query };
    }
    
    // Status should always be approved for public API
    filter.status = "approved";
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with the new schema
    const homestays = await HomestaySingle.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select("homestayId homeStayName villageName address.province address.district homeStayType averageRating");
    
    // Get total count for pagination
    const totalCount = await HomestaySingle.countDocuments(filter);
    
    return NextResponse.json({
      data: homestays,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching homestays:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // First establish connection
    await dbConnect();
    
    // Parse request body
    const body = await req.json();
    
    // Generate unique homestay ID and password
    const homestayId = generateHomestayId(body.homeStayName);
    const password = generateSecurePassword();
    const hashedPassword = hashPassword(password);
    
    console.log(`Processing registration for: ${body.homeStayName}, ID: ${homestayId}`);
    
    // Format data for HomestaySingle model
    const homestayData = {
      homestayId,
      password: hashedPassword,
      homeStayName: body.homeStayName,
      villageName: body.villageName,
      homeCount: body.homeCount,
      roomCount: body.roomCount,
      bedCount: body.bedCount,
      homeStayType: body.homeStayType,
      directions: body.directions,
      address: {
        province: body.province,
        district: body.district,
        municipality: body.municipality,
        ward: body.ward,
        city: body.city,
        tole: body.tole
      },
      features: {
        localAttractions: body.localAttractions,
        tourismServices: body.tourismServices,
        infrastructure: body.infrastructure
      },
      status: 'pending',
      officialIds: [],
      contactIds: []
    };
    
    // Create homestay record - No transaction
    const createdHomestay = await HomestaySingle.create(homestayData);
    console.log(`Created homestay record with ID: ${createdHomestay._id}`);
    
    // Process officials - collect promises for parallel execution
    const officialPromises = body.officials
      .filter((officialData: any) => officialData.name && officialData.role && officialData.contactNo)
      .map(async (officialData: any) => {
        const official = await Official.create({
          homestayId,
          name: officialData.name,
          role: officialData.role,
          contactNo: officialData.contactNo
        });
        
        return official._id;
      });
    
    // Process contacts - collect promises for parallel execution
    const contactPromises = body.contacts
      .filter((contactData: any) => contactData.name && contactData.mobile)
      .map(async (contactData: any) => {
        const contact = await Contact.create({
          homestayId,
          name: contactData.name,
          mobile: contactData.mobile,
          email: contactData.email || "",
          facebook: contactData.facebook || "",
          youtube: contactData.youtube || "",
          instagram: contactData.instagram || "",
          tiktok: contactData.tiktok || "",
          twitter: contactData.twitter || ""
        });
        
        return contact._id;
      });
    
    // Wait for all officials and contacts to be created
    const [officialIds, contactIds] = await Promise.all([
      Promise.all(officialPromises),
      Promise.all(contactPromises)
    ]);
    
    console.log(`Created ${officialIds.length} officials and ${contactIds.length} contacts`);
    
    // Update homestay with official and contact IDs
    if (officialIds.length > 0 || contactIds.length > 0) {
      await HomestaySingle.findByIdAndUpdate(
        createdHomestay._id,
        { 
          $set: { 
            officialIds, 
            contactIds 
          } 
        }
      );
    }
    
    console.log(`Registration completed successfully for ${homestayId}`);
    
    // Return the response with credentials (plain text password for display to user)
    return NextResponse.json({
      success: true,
      message: "Homestay registered successfully",
      homestayId,
      password, // Sending plain password for display to user ONCE
      homestay: {
        ...createdHomestay.toObject(),
        password: undefined // Remove hashed password from response
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("Error creating homestay:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.entries(error.errors).reduce(
        (acc: any, [field, fieldError]: [string, any]) => {
          acc[field] = fieldError.message;
          return acc;
        },
        {}
      );
      
      return NextResponse.json(
        { error: "Validation Error", errors },
        { status: 400 }
      );
    }
    
    // Handle duplicate homestayId
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A homestay with this ID already exists. Please try again." },
        { status: 409 }
      );
    }
    
    // Handle MongoDB connection issues
    if (error.name === "MongooseError" || error.name === "MongoServerError") {
      return NextResponse.json(
        { 
          error: "Database Connection Error", 
          message: "Could not connect to the database. Please try again later."
        },
        { status: 503 }  // Service Unavailable
      );
    }
    
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        message: error.message || "An unexpected error occurred" 
      },
      { status: 500 }
    );
  }
} 