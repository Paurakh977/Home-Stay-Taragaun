import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { HomestaySingle, Official, Contact } from "@/lib/models";
import mongoose from "mongoose";

// Get a specific homestay by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;

    // Find homestay by homestayId
    const homestay = await HomestaySingle.findOne({ homestayId: id }).select("-password");

    if (!homestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }

    // Fetch related officials and contacts
    const [officials, contacts] = await Promise.all([
      Official.find({ homestayId: id }),
      Contact.find({ homestayId: id })
    ]);

    return NextResponse.json({
      homestay,
      officials,
      contacts
    });
  } catch (error) {
    console.error("Error fetching homestay:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Update a homestay
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    // Find homestay to update
    const existingHomestay = await HomestaySingle.findOne({ homestayId: id });
    if (!existingHomestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }

    // Update homestay basic info
    const homestayUpdateData = {
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
      }
    };

    // Update homestay document
    const updatedHomestay = await HomestaySingle.findByIdAndUpdate(
      existingHomestay._id,
      { $set: homestayUpdateData },
      { new: true }
    ).select("-password");

    // Handle officials update if provided
    if (body.officials && Array.isArray(body.officials)) {
      // Delete existing officials and create new ones
      await Official.deleteMany({ homestayId: id });
      
      // Create new officials
      const officialPromises = body.officials
        .filter((o: any) => o.name && o.role && o.contactNo)
        .map((officialData: any) => {
          return Official.create({
            homestayId: id,
            name: officialData.name,
            role: officialData.role,
            contactNo: officialData.contactNo
          });
        });
      
      await Promise.all(officialPromises);
    }

    // Handle contacts update if provided
    if (body.contacts && Array.isArray(body.contacts)) {
      // Delete existing contacts and create new ones
      await Contact.deleteMany({ homestayId: id });
      
      // Create new contacts
      const contactPromises = body.contacts
        .filter((c: any) => c.name && c.mobile)
        .map((contactData: any) => {
          return Contact.create({
            homestayId: id,
            name: contactData.name,
            mobile: contactData.mobile,
            email: contactData.email || "",
            facebook: contactData.facebook || "",
            youtube: contactData.youtube || "",
            instagram: contactData.instagram || "",
            tiktok: contactData.tiktok || "",
            twitter: contactData.twitter || ""
          });
        });
      
      await Promise.all(contactPromises);
    }

    // Fetch the updated officials and contacts
    const [officials, contacts] = await Promise.all([
      Official.find({ homestayId: id }),
      Contact.find({ homestayId: id })
    ]);

    return NextResponse.json({
      success: true,
      message: "Homestay updated successfully",
      homestay: updatedHomestay,
      officials,
      contacts
    });
  } catch (error) {
    console.error("Error updating homestay:", error);
    
    // Handle validation errors
    if (error instanceof mongoose.Error.ValidationError) {
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
    
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Delete a homestay
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = params;

    // Find homestay to delete
    const homestay = await HomestaySingle.findOne({ homestayId: id });
    if (!homestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }

    // Delete the homestay and related data
    await Promise.all([
      HomestaySingle.deleteOne({ homestayId: id }),
      Official.deleteMany({ homestayId: id }),
      Contact.deleteMany({ homestayId: id })
    ]);

    return NextResponse.json({
      success: true,
      message: "Homestay deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting homestay:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 