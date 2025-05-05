import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { HomestaySingle, Contact, Official, Location } from '@/lib/models';

interface ParamsContext {
  params: {
    homestayId: string;
  };
}

export async function PUT(request: NextRequest, context: ParamsContext) {
  try {
    const { homestayId } = context.params;

    if (!homestayId) {
      return NextResponse.json(
        { success: false, error: 'Homestay ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    await dbConnect();

    // Find homestay to update
    const existingHomestay = await HomestaySingle.findOne({ homestayId });
    if (!existingHomestay) {
      return NextResponse.json(
        { success: false, error: 'Homestay not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const homestayUpdateData: any = {};
    
    // Process basic fields
    const basicFields = [
      'homeStayName', 'dhsrNo', 'villageName', 'homeStayType', 'description',
      'homeCount', 'roomCount', 'bedCount', 'profileImage'
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
          updatedAddress[field] = body.address[field];
          addressFieldsChanged = true;
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
        
        updatedAddress.formattedAddress = {
          en: `${tole}, ${city}, ${municipalityEn}, ${districtEn}, ${provinceEn}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,\s*/g, ', '),
          ne: `${tole}, ${city}, ${municipalityNe}, ${districtNe}, ${provinceNe}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,\s*/g, ', ')
        };
      }
      
      homestayUpdateData.address = updatedAddress;
      
      // Also update Location collection if address was changed
      if (addressFieldsChanged) {
        const locationUpdateData: any = {};
        
        if (body.address.province) locationUpdateData.province = body.address.province;
        if (body.address.district) locationUpdateData.district = body.address.district;
        if (body.address.municipality) locationUpdateData.municipality = body.address.municipality;
        if (body.address.ward) locationUpdateData.ward = body.address.ward;
        if (body.address.city) locationUpdateData.city = body.address.city;
        if (body.address.tole) locationUpdateData.tole = body.address.tole;
        
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

    return NextResponse.json({
      success: true,
      message: 'Homestay updated successfully',
      homestay: completeHomestay
    });
  } catch (error) {
    console.error('Error updating homestay:', error);
    
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
        { success: false, error: 'Validation Error', errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update homestay', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 