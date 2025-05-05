import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";
import { v4 as uuidv4 } from "uuid";
import { IHomestaySingle } from '@/lib/models/HomestaySingle';
import mongoose from "mongoose";
import CustomField from "@/lib/models/CustomField";

// Proper interface for UpdateResult
interface UpdateResult {
  acknowledged: boolean;
  matchedCount: number;
  modifiedCount: number;
  upsertedCount: number;
  upsertedId: mongoose.Types.ObjectId | null;
  // Add property for older mongoose versions
  n?: number;
  nModified?: number;
}

// Define types for custom field definitions
interface CustomFieldDefinition {
  fieldId: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  required: boolean;
  addedBy: string;
  addedAt: string;
}

// GET - Fetch custom field definitions (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const adminUsername = searchParams.get('adminUsername');
    const province = searchParams.get('province');
    const district = searchParams.get('district');
    const municipality = searchParams.get('municipality');
    const homeStayType = searchParams.get('homeStayType');
    const homestayId = searchParams.get('homestayId');
    
    // Build query based on filters
    const query: any = {};
    
    if (adminUsername) {
      query.adminUsername = adminUsername;
    }
    
    if (province) {
      query['address.province.en'] = province;
    }
    
    if (district) {
      query['address.district.en'] = district;
    }
    
    if (municipality) {
      query['address.municipality.en'] = municipality;
    }
    
    if (homeStayType) {
      query.homeStayType = homeStayType;
    }
    
    if (homestayId) {
      query.homestayId = homestayId;
    }
    
    // Find all homestays with custom fields
    const homestays = await HomestaySingle.find(query).select('homestayId homeStayName customFields adminUsername');
    
    // Extract all unique field definitions
    const fieldDefinitions = new Map();
    
    homestays.forEach((homestay: IHomestaySingle) => {
      if (homestay.customFields?.definitions) {
        homestay.customFields.definitions.forEach((def: any) => {
          // Use fieldId as key to avoid duplicates
          if (!fieldDefinitions.has(def.fieldId)) {
            // Add home stay information to the definition
            const enhancedDef = {
              ...(def.toObject ? def.toObject() : def),
              appliedTo: [{
                homestayId: homestay.homestayId,
                homeStayName: homestay.homeStayName
              }]
            };
            fieldDefinitions.set(def.fieldId, enhancedDef);
          } else {
            // Add to existing applied to array
            const existingDef = fieldDefinitions.get(def.fieldId);
            existingDef.appliedTo.push({
              homestayId: homestay.homestayId,
              homeStayName: homestay.homeStayName
            });
          }
        });
      }
    });
    
    return NextResponse.json({ 
      fieldDefinitions: Array.from(fieldDefinitions.values()),
      count: fieldDefinitions.size
    });
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return NextResponse.json({ error: 'Failed to fetch custom fields' }, { status: 500 });
  }
}

// POST: Create a new custom field for homestays matching filter criteria
export async function POST(request: Request) {
  try {
    await dbConnect();
    
    // Parse the request body
    const { fieldDefinition, filter, applyToAll, selectedHomestayIds = [] } = await request.json();

    // Debug log the request payload
    console.log('POST /api/superadmin/custom-fields - Request payload:', {
      applyToAll,
      hasSelectedIds: selectedHomestayIds && selectedHomestayIds.length > 0,
      selectedCount: selectedHomestayIds?.length || 0,
      filter
    });

    // Generate a unique field ID if not provided
    const fieldId = fieldDefinition.fieldId || uuidv4();
    
    // Add metadata to field definition
    const completeFieldDefinition: CustomFieldDefinition = {
      ...fieldDefinition,
      fieldId,
      addedBy: 'system',
      addedAt: new Date().toISOString(),
      required: fieldDefinition.required || false
    };
    
    console.log('Processing custom field creation:', {
      fieldId,
      fieldLabel: fieldDefinition.label,
      applyToAll,
      hasSelectedIds: selectedHomestayIds.length > 0,
      selectedCount: selectedHomestayIds.length
    });

    // Build query based on selected homestays or filters
    let query: any = {};
    
    if (!applyToAll && selectedHomestayIds && selectedHomestayIds.length > 0) {
      console.log('Using selected homestay IDs for query:', selectedHomestayIds);
      
      // Handle string ID case (from form selection)
      if (typeof selectedHomestayIds[0] === 'string') {
        // Check if these are already ObjectIds in string form or regular IDs
        const validObjectIds = selectedHomestayIds
          .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
          .map((id: string) => new mongoose.Types.ObjectId(id));
        
        if (validObjectIds.length > 0) {
          console.log(`Found ${validObjectIds.length} valid ObjectIds out of ${selectedHomestayIds.length} selected IDs`);
          query._id = { $in: validObjectIds };
        } else {
          // If these aren't ObjectIds, try using them as homestayId directly
          console.log('No valid ObjectIds found, trying homestayId instead');
          query.homestayId = { $in: selectedHomestayIds };
        }
      } else {
        // These must be some other format, output for debugging
        console.log('Selected IDs are not strings:', typeof selectedHomestayIds[0]);
        return NextResponse.json(
          { error: 'Invalid homestay ID format provided' },
          { status: 400 }
        );
      }
      
      if (Object.keys(query).length === 0) {
        console.log('Could not create a valid query from selected homestay IDs');
        return NextResponse.json(
          { error: 'No valid homestay IDs provided' },
          { status: 400 }
        );
      }
      
      console.log('Final query from selected IDs:', query);
    } else if (applyToAll) {
      console.log('Building filter-based query for all matching homestays');
      
      // Apply filters
      if (filter.adminUsername && filter.adminUsername !== 'all') {
        query.adminUsername = filter.adminUsername;
      }
      
      if (filter.province && filter.province !== 'all') {
        query['address.province.en'] = filter.province;
      }
      
      if (filter.district && filter.district !== 'all') {
        query['address.district.en'] = filter.district;
      }
      
      if (filter.municipality && filter.municipality !== 'all') {
        query['address.municipality.en'] = filter.municipality;
      }
      
      if (filter.homeStayType && filter.homeStayType !== 'all') {
        query.homeStayType = filter.homeStayType;
      }
    } else {
      console.log('No valid query criteria found');
      return NextResponse.json(
        { error: 'No selection criteria provided. Please select specific homestays or apply filters.' },
        { status: 400 }
      );
    }
    
    // Count matching homestays
    const homestayCount = await HomestaySingle.countDocuments(query);
    console.log(`Found ${homestayCount} matching homestays for query:`, query);
    
    if (homestayCount === 0) {
      return NextResponse.json(
        { error: 'No matching homestays found with the provided criteria', query },
        { status: 404 }
      );
    }
    
    // Store the field definition in the custom_fields collection
    const customFieldDoc = {
      fieldId: completeFieldDefinition.fieldId,
      definitions: [completeFieldDefinition]
    };
    
    await CustomField.findOneAndUpdate(
      { fieldId: completeFieldDefinition.fieldId },
      customFieldDoc,
      { upsert: true, new: true }
    );
    
    // Apply the field to all matching homestays
    const updateResult = await HomestaySingle.updateMany(
      query,
      {
        $addToSet: {
          'customFields.definitions': completeFieldDefinition
        }
      },
      { upsert: false }
    ) as unknown as UpdateResult;
    
    console.log('Update result:', updateResult);
    
    return NextResponse.json({
      success: true,
      message: `Custom field "${completeFieldDefinition.label}" created and applied to ${updateResult.nModified || updateResult.modifiedCount || updateResult.n || 0} homestays`,
      fieldId: completeFieldDefinition.fieldId,
      affectedHomestays: updateResult.nModified || updateResult.modifiedCount || updateResult.n || 0,
      query
    });
    
  } catch (err: any) {
    console.error('Error creating custom field:', err);
    return NextResponse.json({ 
      error: 'Failed to create custom field',
      details: err?.message || 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE: Remove a custom field definition
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    
    const fieldId = searchParams.get('fieldId');
    const adminUsername = searchParams.get('adminUsername');
    
    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 });
    }
    
    const query: any = {};
    if (adminUsername && adminUsername !== 'all') {
      query.adminUsername = adminUsername;
    }
    
    query['customFields.definitions'] = {
      $elemMatch: { fieldId }
    };
    
    // Update all homestays to remove this field definition
    const updateResult = await HomestaySingle.updateMany(
      query,
      {
        $pull: {
          'customFields.definitions': { fieldId }
        }
      }
    ) as unknown as UpdateResult;
    
    // Also remove from the custom fields collection
    await CustomField.deleteOne({ fieldId });
    
    console.log(`Deleted custom field ${fieldId} from ${updateResult.nModified || updateResult.modifiedCount || updateResult.n || 0} homestays`);
    
    return NextResponse.json({
      success: true,
      message: `Custom field removed from ${updateResult.nModified || updateResult.modifiedCount || updateResult.n || 0} homestays`,
      fieldId
    });
  } catch (err: any) {
    console.error('Error deleting custom field:', err);
    return NextResponse.json({ error: 'Failed to delete custom field' }, { status: 500 });
  }
} 