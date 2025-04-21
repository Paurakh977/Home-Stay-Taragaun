import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";
import Official from "@/lib/models/Official";
import Contact from "@/lib/models/Contact";
import Location from "@/lib/models/Location";
import { generateHomestayId, generateSecurePassword, hashPassword } from "@/lib/utils";
import mongoose from "mongoose";
import fs from 'fs';
import path from 'path';
import { nanoid } from "nanoid";


// Map province names to numbers for DHSR number generation (1-7)
const provinceNumbers: Record<string, string> = {
  "कोशी": "1", // Koshi
  "मधेश": "2", // Madhesh
  "वागमती": "3", // Bagmati
  "गण्डकी": "4", // Gandaki
  "लुम्बिनी": "5", // Lumbini
  "कर्णाली": "6", // Karnali
  "सुदुर पश्चिम": "7" // Sudurpashchim
};

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

/**
 * Generate a DHSR number in the format:
 * P-[province number (1-7)]-[private/public (0/1)]-000[provincial count]-[overall count]
 */
async function generateDHSRNumber(province: string, homeStayType: string): Promise<string> {
  try {
    // Get province number (1-7)
    const provinceNumber = provinceNumbers[province] || "0";
    
    // Determine if private (0) or community (1)
    const typeCode = homeStayType === "private" ? "0" : "1";
    
    // Count homestays in this province
    const provincialCount = await HomestaySingle.countDocuments({
      "address.province.ne": province
    });
    
    // Get total count of all homestays
    const totalCount = await HomestaySingle.countDocuments();
    
    // Format the provincial count with leading zeros (at least 3 digits)
    const formattedProvincialCount = String(provincialCount + 1).padStart(3, '0');
    
    // Format the DHSR number
    return `P-${provinceNumber}-${typeCode}-${formattedProvincialCount}-${totalCount + 1}`;
  } catch (error) {
    console.error("Error generating DHSR number:", error);
    // Fallback to a simple format if there's an error
    return `P-0-0-000-${Date.now().toString().slice(-4)}`;
  }
}

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
    const lang = searchParams.get("lang") || "ne"; // Default to Nepali
    const adminUsername = searchParams.get("adminUsername");
    const status = searchParams.get("status");
    
    // Build filter
    const filter: any = {};
    
    // Add adminUsername filter if provided
    if (adminUsername) {
      filter.adminUsername = adminUsername;
    }
    
    // Add status filter if provided, default to approved for public requests
    if (status) {
      filter.status = status;
    } else {
      filter.status = "approved"; // Default to showing only approved homestays
    }
    
    if (province) {
      // Handle both old and new schema
      if (province.includes('.')) {
        // Direct path query (e.g., "address.province.ne")
        filter[province] = province;
      } else {
        // Assume new schema with bilingual fields
        filter[`address.province.${lang}`] = province;
      }
    }
    
    if (district) {
      // Handle both old and new schema
      if (district.includes('.')) {
        // Direct path query
        filter[district] = district;
      } else {
        // Assume new schema with bilingual fields
        filter[`address.district.${lang}`] = district;
      }
    }
    
    if (query) {
      filter.$text = { $search: query };
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute query with the new schema
    const homestaysData = await HomestaySingle.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select("homestayId homeStayName villageName address homeStayType averageRating profileImage adminUsername")
      .lean();
    
    // Format the response to handle bilingual address fields
    const formattedHomestays = homestaysData.map(homestay => {
      // Use type assertion to handle the document safely
      const rawHomestay = homestay as any;
      
      // Check if we need to set profile image from uploads directory
      if (!rawHomestay.profileImage) {
        // Get the homestay ID for folder name
        const homestayId = rawHomestay.homestayId;
        if (homestayId) {
          // Profile images are stored in uploads/[homestayId]/profile/profile.[ext]
          const possiblePaths = [
            `/uploads/${homestayId}/profile/profile.jpg`,
            `/uploads/${homestayId}/profile/profile.png`
          ];
          
          // Use the first path format as default
          rawHomestay.profileImage = possiblePaths[0];
        }
      }
      
      // Check if we have the new bilingual format
      const hasBilingualAddress = 
        rawHomestay.address && 
        rawHomestay.address.province && 
        typeof rawHomestay.address.province === 'object' &&
        'en' in rawHomestay.address.province;
      
      // Format address based on schema and language preference
      if (hasBilingualAddress) {
        return {
          ...rawHomestay,
          address: {
            province: lang === 'en' ? rawHomestay.address.province.en : rawHomestay.address.province.ne,
            district: lang === 'en' ? rawHomestay.address.district.en : rawHomestay.address.district.ne,
            municipality: lang === 'en' ? rawHomestay.address.municipality.en : rawHomestay.address.municipality.ne,
            ward: lang === 'en' ? rawHomestay.address.ward.en : rawHomestay.address.ward.ne,
            city: rawHomestay.address.city,
            tole: rawHomestay.address.tole,
            formattedAddress: lang === 'en' 
              ? rawHomestay.address.formattedAddress.en 
              : rawHomestay.address.formattedAddress.ne,
            // Include full translations for clients that need them
            translations: {
              province: rawHomestay.address.province,
              district: rawHomestay.address.district,
              municipality: rawHomestay.address.municipality,
              ward: rawHomestay.address.ward,
              formattedAddress: rawHomestay.address.formattedAddress
            }
          }
        };
      } else {
        // Return original format for backward compatibility
        return rawHomestay;
      }
    });
    
    // Get total count for pagination
    const totalCount = await HomestaySingle.countDocuments(filter);
    
    return NextResponse.json({
      data: formattedHomestays,
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
    
    // Ensure adminUsername is provided
    if (!body.adminUsername) {
      return NextResponse.json(
        { success: false, error: "Admin username is required" },
        { status: 400 }
      );
    }
    
    // Verify that the admin user exists
    const adminUser = await mongoose.model('User').findOne({
      username: body.adminUsername,
      role: 'admin'
    });
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Admin user not found" },
        { status: 404 }
      );
    }
    
    // Generate unique homestay ID and password
    const homestayId = generateHomestayId(body.homeStayName);
    const password = generateSecurePassword();
    const hashedPassword = hashPassword(password);
    
    console.log(`Processing registration for: ${body.homeStayName}, ID: ${homestayId}`);
    
    // Get English translations for the address fields
    const provinceEn = provinceTranslations[body.province] || body.province;
    const districtEn = findBestTranslation(body.district, 'district');
    const municipalityEn = findBestTranslation(body.municipality, 'municipality');
    const wardEn = translateWard(body.ward);
    
    // Create formatted addresses in both languages
    const formattedAddressNe = `${body.tole}, ${body.city}, ${body.municipality}, ${body.district}, ${body.province}`;
    const formattedAddressEn = `${body.tole}, ${body.city}, ${municipalityEn}, ${districtEn}, ${provinceEn}`;
    
    // Generate DHSR number
    const dhsrNo = await generateDHSRNumber(body.province, body.homeStayType);
    console.log(`Generated DHSR number: ${dhsrNo} for homestay: ${homestayId}`);
    
    // Format data for HomestaySingle model with bilingual address
    const homestayData = {
      homestayId,
      password: hashedPassword,
      dhsrNo, // Add DHSR number
      adminUsername: body.adminUsername, // Store the admin username
      homeStayName: body.homeStayName,
      villageName: body.villageName,
      homeCount: body.homeCount,
      roomCount: body.roomCount,
      bedCount: body.bedCount,
      homeStayType: body.homeStayType,
      directions: body.directions || "",
      latitude: body.latitude || null, // Add latitude
      longitude: body.longitude || null, // Add longitude
      featureAccess: {
        dashboard: false,
        profile: false,
        portal: false,
        documents: false,
        imageUpload: false,
        settings: false,
        chat: false,
        updateInfo: false
      },
      address: {
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
        }
      },
      features: {
        localAttractions: body.localAttractions,
        tourismServices: body.tourismServices,
        infrastructure: body.infrastructure
      },
      status: 'pending',
      officialIds: [],
      contactIds: [],
      customFields: {
        definitions: [],
        values: {}
      }
    };
    
    // Create homestay record - No transaction
    const createdHomestay = await HomestaySingle.create(homestayData);
    console.log(`Created homestay record with ID: ${createdHomestay._id}`);
    
    // Save location data to Location Collection
    try {
      const locationData = {
        homestayId,
        province: {
          ne: body.province,
          en: provinceEn
        },
        district: {
          ne: body.district,
          en: districtEn
        },
        municipality: {
          ne: body.municipality,
          en: municipalityEn
        },
        ward: {
          ne: body.ward,
          en: wardEn
        },
        city: body.city || '',
        tole: body.tole || '',
        formattedAddress: {
          ne: `${body.tole || ''}, ${body.city || ''}, ${body.ward}, ${body.municipality}, ${body.district}, ${body.province}`,
          en: `${body.tole || ''}, ${body.city || ''}, ${wardEn}, ${municipalityEn}, ${districtEn}, ${provinceEn}`
        },
        isVerified: false
      };

      // Insert to Location collection
      const savedLocation = await Location.create(locationData);
      
      console.log(`Location data saved with ID: ${savedLocation._id} for homestay: ${homestayId}`);
      
      // Process officials - collect promises for parallel execution
      const officialPromises = body.officials
        .filter((officialData: any) => officialData.name && officialData.role && officialData.contactNo)
        .map(async (officialData: any) => {
          const official = await Official.create({
            homestayId,
            name: officialData.name,
            role: officialData.role,
            contactNo: officialData.contactNo,
            gender: officialData.gender || "male"
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
      await HomestaySingle.findByIdAndUpdate(
        createdHomestay._id,
        { 
          $set: { 
            officialIds, 
            contactIds 
          } 
        }
      );
      
      // Apply any existing custom field definitions
      await applyExistingCustomFields(createdHomestay);
      
      console.log(`Registration completed successfully for ${homestayId}`);
      
      // Return the response with credentials (plain text password for display to user)
      return NextResponse.json({
        success: true,
        message: "Homestay registered successfully",
        homestayId,
        password, // Sending plain password for display to user ONCE
        dhsrNo, // Include DHSR number in the response
        homestay: {
          ...createdHomestay.toObject(),
          password: undefined // Remove hashed password from response
        }
      }, { status: 201 });
      
    } catch (error: any) {
      console.error("Error saving location data:", error);
      
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

// Apply any existing custom field definitions matching the new homestay's criteria
const applyExistingCustomFields = async (homestay: any) => {
  try {
    // Find any global or region-specific custom field definitions
    const customFieldDefinitions = await HomestaySingle.aggregate([
      {
        $match: {
          // Find homestays that have custom fields defined
          'customFields.definitions': { $exists: true, $not: { $size: 0 } }
        }
      },
      {
        $project: {
          _id: 0,
          customFields: 1
        }
      }
    ]);
    
    // Extract all unique custom field definitions
    const allDefinitions = new Set();
    
    customFieldDefinitions.forEach((doc: any) => {
      if (doc.customFields && Array.isArray(doc.customFields.definitions)) {
        doc.customFields.definitions.forEach((def: any) => {
          // Only add if it's not already in the set
          if (!allDefinitions.has(def.fieldId)) {
            allDefinitions.add(JSON.stringify(def));
          }
        });
      }
    });
    
    // If there are any definitions, add them to the new homestay
    if (allDefinitions.size > 0) {
      const definitions = Array.from(allDefinitions).map(defStr => JSON.parse(defStr as string));
      
      await HomestaySingle.findByIdAndUpdate(
        homestay._id,
        {
          $set: {
            'customFields.definitions': definitions
          }
        }
      );
      
      console.log(`Applied ${definitions.length} existing custom field definitions`);
    }
  } catch (error) {
    console.error('Error applying custom field definitions:', error);
    // Don't throw - this is a non-critical operation
  }
}; 