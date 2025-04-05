import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";
import Official from "@/lib/models/Official";
import Contact from "@/lib/models/Contact";
import Location from "@/lib/models/Location";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

// Import translation maps
const provinceTranslations: Record<string, string> = {
  "कोशी": "Koshi",
  "मधेश": "Madhesh",
  "वागमती": "Bagmati",
  "गण्डकी": "Gandaki",
  "लुम्बिनी": "Lumbini",
  "कर्णाली": "Karnali",
  "सुदुर पश्चिम": "Sudurpashchim"
};

// Helper function to find the best English translation
const findBestTranslation = (nepaliValue: string, type: 'district' | 'municipality'): string => {
  try {
    if (!nepaliValue) return '';
    
    // Read translations from JSON files in the public directory using filesystem
    let translationsMap: Record<string, string> = {};
    
    try {
      const publicPath = path.join(process.cwd(), 'public', 'address');
      
      if (type === 'district') {
        const filePath = path.join(publicPath, 'all-districts.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        translationsMap = JSON.parse(fileContent);
      } else if (type === 'municipality') {
        const filePath = path.join(publicPath, 'all-municipalities.json');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        translationsMap = JSON.parse(fileContent);
      }
    } catch (fileError) {
      console.warn(`Could not read translation file for ${type}:`, fileError);
      // If files can't be loaded, return the original value
      return nepaliValue;
    }
    
    // Clean and normalize the value
    const cleanValue = nepaliValue.trim().replace(/\s+/g, ' ');
    
    // Try direct lookup
    if (translationsMap[cleanValue]) {
      return translationsMap[cleanValue];
    } 
    // Then try with a space
    else if (translationsMap[cleanValue + ' ']) {
      return translationsMap[cleanValue + ' '];
    }
    // Find similar match
    else {
      // Look for keys that contain this value or vice versa
      const possibleKey = Object.keys(translationsMap)
        .find(key => key.includes(cleanValue) || cleanValue.includes(key));
      
      if (possibleKey) {
        return translationsMap[possibleKey];
      }
    }
    
    // If no translation found, return the original value
    return nepaliValue;
  } catch (error) {
    console.error(`Error finding translation for ${type}:`, error);
    return nepaliValue;
  }
};

// Convert Nepali numeric ward to English
const translateWard = (ward: string): string => {
  const wardMap: Record<string, string> = {
    '१': '1', '२': '2', '३': '3', '४': '4', '५': '5',
    '६': '6', '७': '7', '८': '8', '९': '9', '०': '0'
  };
  
  let englishWard = '';
  for (let i = 0; i < ward.length; i++) {
    const char = ward[i];
    englishWard += wardMap[char] || char;
  }
  
  return englishWard;
};

// Get a specific homestay by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = context.params;

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
  context: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = context.params;
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
      directions: body.directions || "",
      address: {
        province: {
          en: provinceTranslations[body.province] || body.province,
          ne: body.province
        },
        district: {
          en: findBestTranslation(body.district, 'district'),
          ne: body.district
        },
        municipality: {
          en: findBestTranslation(body.municipality, 'municipality'),
          ne: body.municipality
        },
        ward: {
          en: translateWard(body.ward),
          ne: body.ward
        },
        city: body.city,
        tole: body.tole,
        formattedAddress: {
          en: `${body.tole}, ${body.city}, ${findBestTranslation(body.municipality, 'municipality')}, ${findBestTranslation(body.district, 'district')}, ${provinceTranslations[body.province] || body.province}`,
          ne: `${body.tole}, ${body.city}, ${body.municipality}, ${body.district}, ${body.province}`
        }
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
    
    // Update location data in Location collection
    if (body.province || body.district || body.municipality || body.ward || body.city || body.tole) {
      // Get English translations
      const provinceEn = provinceTranslations[body.province] || body.province;
      const districtEn = findBestTranslation(body.district, 'district');
      const municipalityEn = findBestTranslation(body.municipality, 'municipality');
      const wardEn = translateWard(body.ward);
      
      // Create formatted addresses in both languages
      const formattedAddressNe = `${body.tole}, ${body.city}, ${body.municipality}, ${body.district}, ${body.province}`;
      const formattedAddressEn = `${body.tole}, ${body.city}, ${municipalityEn}, ${districtEn}, ${provinceEn}`;
      
      const locationUpdateData = {
        province: {
          en: provinceEn,
          ne: body.province
        },
        district: {
          en: districtEn,
          ne: body.district
        },
        municipality: {
          en: municipalityEn,
          ne: body.municipality
        },
        ward: {
          en: wardEn,
          ne: body.ward
        },
        city: body.city,
        tole: body.tole,
        formattedAddress: {
          en: formattedAddressEn,
          ne: formattedAddressNe
        },
        // Add empty location field to avoid validation errors
        location: {
          type: 'Point',
          coordinates: null
        }
      };
      
      // Find and update the location or create if it doesn't exist
      await Location.findOneAndUpdate(
        { homestayId: id },
        { $set: locationUpdateData },
        { upsert: true, new: true }
      );
    }

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
  context: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id } = context.params;

    // Find homestay
    const homestay = await HomestaySingle.findOne({ homestayId: id });
    if (!homestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }

    // Delete related officials
    await Official.deleteMany({ homestayId: id });
    
    // Delete related contacts
    await Contact.deleteMany({ homestayId: id });
    
    // Delete related location
    await Location.deleteMany({ homestayId: id });
    
    // Delete homestay
    await HomestaySingle.deleteOne({ homestayId: id });

    return NextResponse.json({
      success: true,
      message: "Homestay and all related data deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting homestay:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 