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
    
    // These fields are added to satisfy MongoDB validation but are not required
    location: {
      type: { type: String, default: 'Point', required: false },
      coordinates: { 
        type: [Number],
        required: false,
        default: null,
        validate: {
          validator: function(v: any) {
            // Either null or an array with exactly 2 numbers
            return v === null || (Array.isArray(v) && v.length === 2 && 
              !isNaN(parseFloat(v[0])) && !isNaN(parseFloat(v[1])));
          },
          message: "Coordinates must be null or [longitude, latitude]"
        }
      }
    },
    
    // Flag to indicate if coordinates have been verified
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true, 
    collection: 'HomestayLocations', // Changed collection name to start fresh
    strict: false // Allow additional fields for flexibility
  }
);

// Create index on homestayId for fast lookups
locationSchema.index({ homestayId: 1 });

// Add 2dsphere index for geospatial queries if coordinates are present
locationSchema.index({ location: '2dsphere' });

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