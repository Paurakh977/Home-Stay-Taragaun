import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/mongodb';
import { HomestaySingle, Official, Contact, Location } from '@/lib/models';

// Use the JWT_SECRET from environment or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function PUT(
  request: NextRequest,
  { params }: { params: { homestayId: string } }
) {
  try {
    // Connect to database
    await dbConnect();
    
    const { homestayId } = params;
    console.log(`API: Officer updating homestay with ID: ${homestayId}`);
    
    // Get the auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('officer_token')?.value;
    
    if (!token) {
      console.log('API: No officer token found');
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload || !payload.userId || payload.role !== 'officer' || !payload.isOfficer) {
      console.log('API: Invalid token or not officer role', { payload });
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Check if officer has homestayEdit permission
    const permissions = payload.permissions as Record<string, boolean> || {};
    if (!permissions.homestayEdit) {
      console.log('API: Officer lacks homestayEdit permission');
      return NextResponse.json(
        { success: false, message: 'You do not have permission to edit homestays' },
        { status: 403 }
      );
    }
    
    // Get the parent admin username from the payload
    const parentAdmin = payload.parentAdmin;
    
    if (!parentAdmin) {
      console.log('API: No parent admin in token');
      return NextResponse.json(
        { success: false, message: 'Invalid token data' },
        { status: 401 }
      );
    }
    
    // Get update data from request body
    const body = await request.json();
    
    // Find the homestay and ensure it belongs to the parent admin
    const existingHomestay = await HomestaySingle.findOne({ 
      homestayId, 
      adminUsername: parentAdmin 
    });
    
    if (!existingHomestay) {
      console.log(`API: Homestay not found or doesn't belong to admin: ${parentAdmin}`);
      return NextResponse.json(
        { success: false, message: 'Homestay not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const homestayUpdateData: any = {};
    
    // Process basic fields
    const basicFields = [
      'homeStayName', 'dhsrNo', 'villageName', 'homeStayType', 'description',
      'homeCount', 'roomCount', 'bedCount', 'profileImage', 'latitude', 'longitude',
      'directions', 'registrationAuthority', 'businessRegistrationNumber'
    ];
    
    basicFields.forEach(field => {
      if (body[field] !== undefined) {
        homestayUpdateData[field] = body[field];
      }
    });
    
    // Process address if provided
    if (body.address) {
      // Get existing address to merge with updates
      const currentAddress = existingHomestay.address || {};
      
      // Create a deep copy of the current address
      const updatedAddress = JSON.parse(JSON.stringify(currentAddress));
      
      // Update address fields that were provided
      const addressFields = [
        'province', 'district', 'municipality', 'ward', 'city', 'tole'
      ];
      
      let addressFieldsChanged = false;
      
      addressFields.forEach(field => {
        if (body.address[field] !== undefined) {
          // Ensure we're preserving the bilingual structure for province, district, municipality and ward
          if (['province', 'district', 'municipality', 'ward'].includes(field)) {
            // Make sure the field has both 'en' and 'ne' properties
            if (body.address[field] && 
                typeof body.address[field] === 'object' && 
                'en' in body.address[field] && 
                'ne' in body.address[field]) {
              updatedAddress[field] = body.address[field];
              addressFieldsChanged = true;
            } else {
              console.warn(`Officer API: Address field ${field} is missing bilingual structure`);
            }
          } else {
            // For non-bilingual fields like city and tole
            updatedAddress[field] = body.address[field];
            addressFieldsChanged = true;
          }
        }
      });
      
      // Only update formattedAddress if address fields changed
      if (addressFieldsChanged) {
        // Create formatted address from components
        const tole = updatedAddress.tole || '';
        const city = updatedAddress.city || '';
        const municipalityEn = updatedAddress.municipality?.en || '';
        const districtEn = updatedAddress.district?.en || '';
        const provinceEn = updatedAddress.province?.en || '';
        
        const municipalityNe = updatedAddress.municipality?.ne || '';
        const districtNe = updatedAddress.district?.ne || '';
        const provinceNe = updatedAddress.province?.ne || '';
        
        // Format addresses properly with commas and handle empty fields
        updatedAddress.formattedAddress = {
          en: `${tole ? tole + ', ' : ''}${city ? city + ', ' : ''}${municipalityEn ? municipalityEn + ', ' : ''}${districtEn ? districtEn + ', ' : ''}${provinceEn}`.replace(/,\s*$/, '').replace(/,\s*,\s*/g, ', '),
          ne: `${tole ? tole + ', ' : ''}${city ? city + ', ' : ''}${municipalityNe ? municipalityNe + ', ' : ''}${districtNe ? districtNe + ', ' : ''}${provinceNe}`.replace(/,\s*$/, '').replace(/,\s*,\s*/g, ', ')
        };
        
        console.log(`Officer API: Updated formattedAddress for ${homestayId}:`, updatedAddress.formattedAddress);
      }
      
      homestayUpdateData.address = updatedAddress;
      
      // Also update Location collection if address was changed or coordinates were updated
      if (addressFieldsChanged || body.latitude !== undefined || body.longitude !== undefined) {
        const locationUpdateData: any = {};
        
        if (body.address?.province) locationUpdateData.province = body.address.province;
        if (body.address?.district) locationUpdateData.district = body.address.district;
        if (body.address?.municipality) locationUpdateData.municipality = body.address.municipality;
        if (body.address?.ward) locationUpdateData.ward = body.address.ward;
        if (body.address?.city) locationUpdateData.city = body.address.city;
        if (body.address?.tole) locationUpdateData.tole = body.address.tole;
        
        // Update coordinates if provided
        if (body.latitude !== undefined) locationUpdateData.latitude = body.latitude;
        if (body.longitude !== undefined) locationUpdateData.longitude = body.longitude;
        
        // Find and update location record
        await Location.findOneAndUpdate(
          { homestayId },
          { $set: locationUpdateData },
          { upsert: true }
        );
      }
    }
    
    // Process features if provided
    if (body.features) {
      const currentFeatures = existingHomestay.features || {};
      
      // Create a new features object
      const updatedFeatures: any = { ...currentFeatures };
      
      if (body.features.localAttractions) {
        updatedFeatures.localAttractions = body.features.localAttractions;
      }
      
      if (body.features.tourismServices) {
        updatedFeatures.tourismServices = body.features.tourismServices;
      }
      
      if (body.features.infrastructure) {
        updatedFeatures.infrastructure = body.features.infrastructure;
      }
      
      homestayUpdateData.features = updatedFeatures;
    }
    
    // Process contacts if provided
    if (body.contacts && Array.isArray(body.contacts)) {
      // Delete existing contacts
      await Contact.deleteMany({ homestayId });
      
      // Create new contacts
      const contactPromises = body.contacts
        .filter((c: any) => c.name && c.mobile)
        .map((contactData: any) => {
          return Contact.create({
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
        });
      
      await Promise.all(contactPromises);
    }
    
    // Process officials if provided
    if (body.officials && Array.isArray(body.officials)) {
      // Delete existing officials
      await Official.deleteMany({ homestayId });
      
      // Create new officials
      const officialPromises = body.officials
        .filter((o: any) => o.name && o.role && o.contactNo)
        .map((officialData: any) => {
          return Official.create({
            homestayId,
            name: officialData.name,
            role: officialData.role,
            contactNo: officialData.contactNo,
            email: officialData.email || "",
            gender: officialData.gender || "male"
          });
        });
      
      await Promise.all(officialPromises);
    }
    
    // Add audit information
    homestayUpdateData.lastUpdatedBy = payload.username;
    homestayUpdateData.lastUpdatedAt = new Date();
    
    // Update homestay document
    const updatedHomestay = await HomestaySingle.findByIdAndUpdate(
      existingHomestay._id,
      { $set: homestayUpdateData },
      { new: true }
    ).lean();
    
    // Fetch updated officials and contacts
    const [officials, contacts] = await Promise.all([
      Official.find({ homestayId }).lean(),
      Contact.find({ homestayId }).lean()
    ]);
    
    // Complete the homestay object with joined data
    const completeHomestay = {
      ...updatedHomestay,
      officials,
      contacts
    };
    
    console.log(`API: Successfully updated homestay data for ID: ${homestayId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Homestay updated successfully',
      homestay: completeHomestay
    });
    
  } catch (error: any) {
    console.error('Error in officer homestay update API:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
} 