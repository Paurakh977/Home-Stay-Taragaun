import mongoose, { Schema } from 'mongoose';

// Define the bilingual field type for address components
const bilingualField = {
  en: { type: String, required: true },
  ne: { type: String, required: true }
};

// Define the homestay location schema with bilingual address fields
const locationSchema = new Schema(
  {
    // Link to the homestay by ID
    homestayId: {
      type: String,
      required: true,
      index: true,
      unique: true
    },
    
    // Address components with bilingual support
    province: bilingualField,
    district: bilingualField,
    municipality: bilingualField,
    ward: bilingualField,
    
    // These fields remain as simple strings (not bilingual)
    city: { type: String, required: true },
    tole: { type: String, required: true },
    
    // Formatted address with bilingual support
    formattedAddress: bilingualField,
    
    // Flag to indicate verification status (can be used for admin approval)
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true, 
    collection: 'HomestayLocations',
    strict: false // Allow additional fields for flexibility
  }
);

// Don't create additional index since it's already defined in the schema
// locationSchema.index({ homestayId: 1 });

// Clear existing model if in development to avoid schema conflicts
try {
  if (process.env.NODE_ENV !== 'production') {
    // Delete the model if it exists to allow schema changes during development
    if (mongoose.models.Location) {
      delete mongoose.models.Location;
    }
  }
} catch (error) {
  console.warn('Failed to delete existing model:', error);
}

// Create model
const Location = mongoose.models.Location || mongoose.model('Location', locationSchema);

export default Location; 