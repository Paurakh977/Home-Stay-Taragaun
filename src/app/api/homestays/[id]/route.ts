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
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Extract ID from URL directly to avoid the params.id issue
    const pathname = request.nextUrl.pathname;
    const homestayId = pathname.split('/').pop() || '';
    
    // Find homestay by homestayId
    const homestay = await HomestaySingle.findOne({ homestayId }).select("-password");

    if (!homestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }

    // Fetch related officials and contacts
    const [officials, contacts] = await Promise.all([
      Official.find({ homestayId }),
      Contact.find({ homestayId })
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
    
    // Extract ID from URL directly
    const pathname = request.nextUrl.pathname;
    const homestayId = pathname.split('/').pop() || '';
    
    const body = await request.json();

    // Find homestay to update
    const existingHomestay = await HomestaySingle.findOne({ homestayId });
    if (!existingHomestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }

    // Prepare update data - only include fields that are present in the request
    const homestayUpdateData: any = {};
    
    // Basic fields
    if (body.homeStayName) homestayUpdateData.homeStayName = body.homeStayName;
    if (body.villageName) homestayUpdateData.villageName = body.villageName;
    if (body.homeCount) homestayUpdateData.homeCount = body.homeCount;
    if (body.roomCount) homestayUpdateData.roomCount = body.roomCount;
    if (body.bedCount) homestayUpdateData.bedCount = body.bedCount;
    if (body.homeStayType) homestayUpdateData.homeStayType = body.homeStayType;
    if (body.directions !== undefined) homestayUpdateData.directions = body.directions || "";
    if (body.profileImage !== undefined) homestayUpdateData.profileImage = body.profileImage;
    
    // Handle address updates
    // Check if address is provided as a complete object (new format)
    if (body.address) {
      // Get the existing address to merge with updates
      const currentAddress = existingHomestay.address || {};
      
      // Build updated address object
      const updatedAddress: any = {
        province: { ...currentAddress.province },
        district: { ...currentAddress.district },
        municipality: { ...currentAddress.municipality },
        ward: { ...currentAddress.ward },
        city: currentAddress.city,
        tole: currentAddress.tole,
        formattedAddress: { ...currentAddress.formattedAddress }
      };
      
      // Update from the address object
      if (body.address.province) {
        updatedAddress.province = body.address.province;
      }
      
      if (body.address.district) {
        updatedAddress.district = body.address.district;
      }
      
      if (body.address.municipality) {
        updatedAddress.municipality = body.address.municipality;
      }
      
      if (body.address.ward) {
        updatedAddress.ward = body.address.ward;
      }
      
      if (body.address.city) updatedAddress.city = body.address.city;
      if (body.address.tole) updatedAddress.tole = body.address.tole;
      
      // Only regenerate formatted address if one of the address components changed
      if (body.address.province || body.address.district || body.address.municipality || 
          body.address.city || body.address.tole) {
        
        // Use current values for any missing fields
        const tole = body.address.tole || updatedAddress.tole;
        const city = body.address.city || updatedAddress.city;
        const municipalityEn = body.address.municipality?.en || updatedAddress.municipality?.en || '';
        const districtEn = body.address.district?.en || updatedAddress.district?.en || '';
        const provinceEn = body.address.province?.en || updatedAddress.province?.en || '';
        
        const municipalityNe = body.address.municipality?.ne || updatedAddress.municipality?.ne || '';
        const districtNe = body.address.district?.ne || updatedAddress.district?.ne || '';
        const provinceNe = body.address.province?.ne || updatedAddress.province?.ne || '';
        
        updatedAddress.formattedAddress = {
          en: `${tole}, ${city}, ${municipalityEn}, ${districtEn}, ${provinceEn}`,
          ne: `${tole}, ${city}, ${municipalityNe}, ${districtNe}, ${provinceNe}`
        };
      }
      
      homestayUpdateData.address = updatedAddress;
    }
    // Handle legacy format where address fields are provided individually
    else if (body.province || body.district || body.municipality || 
             body.ward || body.city || body.tole) {
      // Get the existing address to merge with updates
      const currentAddress = existingHomestay.address || {};
      
      // Build updated address object
      const updatedAddress: any = {
        province: { ...currentAddress.province },
        district: { ...currentAddress.district },
        municipality: { ...currentAddress.municipality },
        ward: { ...currentAddress.ward },
        city: currentAddress.city,
        tole: currentAddress.tole,
        formattedAddress: { ...currentAddress.formattedAddress }
      };
      
      // Update only the provided fields
      if (body.province) {
        updatedAddress.province = {
          en: provinceTranslations[body.province] || body.province,
          ne: body.province
        };
      }
      
      if (body.district) {
        updatedAddress.district = {
          en: findBestTranslation(body.district, 'district'),
          ne: body.district
        };
      }
      
      if (body.municipality) {
        updatedAddress.municipality = {
          en: findBestTranslation(body.municipality, 'municipality'),
          ne: body.municipality
        };
      }
      
      if (body.ward) {
        updatedAddress.ward = {
          en: translateWard(body.ward),
          ne: body.ward
        };
      }
      
      if (body.city) updatedAddress.city = body.city;
      if (body.tole) updatedAddress.tole = body.tole;
      
      // Only regenerate formatted address if one of the address components changed
      if (body.province || body.district || body.municipality || body.city || body.tole) {
        // Use current values for any missing fields
        const tole = body.tole || updatedAddress.tole;
        const city = body.city || updatedAddress.city;
        const municipality = body.municipality || (updatedAddress.municipality?.ne || '');
        const district = body.district || (updatedAddress.district?.ne || '');
        const province = body.province || (updatedAddress.province?.ne || '');
        
        // Generate English versions for formatting
        const municipalityEn = body.municipality ? 
          findBestTranslation(body.municipality, 'municipality') : 
          updatedAddress.municipality?.en || '';
          
        const districtEn = body.district ? 
          findBestTranslation(body.district, 'district') : 
          updatedAddress.district?.en || '';
          
        const provinceEn = body.province ? 
          (provinceTranslations[body.province] || body.province) : 
          updatedAddress.province?.en || '';
        
        updatedAddress.formattedAddress = {
          en: `${tole}, ${city}, ${municipalityEn}, ${districtEn}, ${provinceEn}`,
          ne: `${tole}, ${city}, ${municipality}, ${district}, ${province}`
        };
      }
      
      homestayUpdateData.address = updatedAddress;
    }
    
    // Handle features updates if provided
    if (body.localAttractions || body.tourismServices || body.infrastructure) {
      const currentFeatures = existingHomestay.features || {};
      
      homestayUpdateData.features = {
        localAttractions: body.localAttractions || currentFeatures.localAttractions || [],
        tourismServices: body.tourismServices || currentFeatures.tourismServices || [],
        infrastructure: body.infrastructure || currentFeatures.infrastructure || []
      };
    }

    // Update homestay document with the partial data
    const updatedHomestay = await HomestaySingle.findByIdAndUpdate(
      existingHomestay._id,
      { $set: homestayUpdateData },
      { new: true }
    ).select("-password");
    
    // Update location data in Location collection if address fields changed
    if (body.address || body.province || body.district || body.municipality || 
        body.ward || body.city || body.tole) {
      // Find existing location
      const existingLocation = await Location.findOne({ homestayId: homestayId });
      
      if (existingLocation) {
        const locationUpdateData: any = {};
        
        // If address is provided as a complete object
        if (body.address) {
          if (body.address.province) locationUpdateData.province = body.address.province;
          if (body.address.district) locationUpdateData.district = body.address.district;
          if (body.address.municipality) locationUpdateData.municipality = body.address.municipality;
          if (body.address.ward) locationUpdateData.ward = body.address.ward;
          if (body.address.city) locationUpdateData.city = body.address.city;
          if (body.address.tole) locationUpdateData.tole = body.address.tole;
        }
        // Handle legacy individual fields
        else {
          if (body.province) {
            locationUpdateData.province = {
              en: provinceTranslations[body.province] || body.province,
              ne: body.province
            };
          }
          
          if (body.district) {
            locationUpdateData.district = {
              en: findBestTranslation(body.district, 'district'),
              ne: body.district
            };
          }
          
          if (body.municipality) {
            locationUpdateData.municipality = {
              en: findBestTranslation(body.municipality, 'municipality'),
              ne: body.municipality
            };
          }
          
          if (body.ward) {
            locationUpdateData.ward = {
              en: translateWard(body.ward),
              ne: body.ward
            };
          }
          
          if (body.city) locationUpdateData.city = body.city;
          if (body.tole) locationUpdateData.tole = body.tole;
        }
        
        // Update formattedAddress if it was regenerated
        if (homestayUpdateData.address?.formattedAddress) {
          locationUpdateData.formattedAddress = homestayUpdateData.address.formattedAddress;
        }
        
        // Update the location document
        await Location.updateOne(
          { homestayId: homestayId },
          { $set: locationUpdateData }
        );
      }
    }

    // Handle officials update if provided
    if (body.officials && Array.isArray(body.officials)) {
      // Delete existing officials and create new ones
      await Official.deleteMany({ homestayId: homestayId });
      
      // Create new officials
      const officialPromises = body.officials
        .filter((o: any) => o.name && o.role && o.contactNo)
        .map((officialData: any) => {
          return Official.create({
            homestayId: homestayId,
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
      await Contact.deleteMany({ homestayId: homestayId });
      
      // Create new contacts
      const contactPromises = body.contacts
        .filter((c: any) => c.name && c.mobile)
        .map((contactData: any) => {
          return Contact.create({
            homestayId: homestayId,
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
      Official.find({ homestayId: homestayId }),
      Contact.find({ homestayId: homestayId })
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

// Update portal information (PATCH method)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Extract ID from URL directly
    const pathname = request.nextUrl.pathname;
    const homestayId = pathname.split('/').pop() || '';
    
    const body = await request.json();

    // Find homestay to update
    const existingHomestay = await HomestaySingle.findOne({ homestayId });
    if (!existingHomestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }

    // Prepare update data for portal fields only
    const portalUpdateData: any = {};
    
    // Update description if provided
    if (body.description !== undefined) {
      portalUpdateData.description = body.description;
    }
    
    // Update gallery images if provided
    if (body.galleryImages !== undefined) {
      portalUpdateData.galleryImages = body.galleryImages;
    }
    
    // Only update if there are fields to update
    if (Object.keys(portalUpdateData).length > 0) {
      // Update the homestay
      const updatedHomestay = await HomestaySingle.findOneAndUpdate(
        { homestayId },
        { $set: portalUpdateData },
        { new: true }
      ).select("-password");
      
      return NextResponse.json({
        success: true,
        message: "Portal information updated successfully",
        homestay: updatedHomestay
      });
    } else {
      return NextResponse.json(
        { error: "No portal fields to update" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating portal information:", error);
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
    
    // Extract ID from URL directly
    const pathname = request.nextUrl.pathname;
    const homestayId = pathname.split('/').pop() || '';
    
    // Find homestay
    const homestay = await HomestaySingle.findOne({ homestayId });
    if (!homestay) {
      return NextResponse.json(
        { error: "Homestay not found" },
        { status: 404 }
      );
    }

    // Delete related officials
    await Official.deleteMany({ homestayId: homestayId });
    
    // Delete related contacts
    await Contact.deleteMany({ homestayId: homestayId });
    
    // Delete related location
    await Location.deleteMany({ homestayId: homestayId });
    
    // Delete homestay
    await HomestaySingle.deleteOne({ homestayId: homestayId });

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