import mongoose, { Schema } from 'mongoose';

// Define a simple schema for bilingual fields without requiring them to be string type
const bilingualField = {
  en: { type: String, required: true },
  ne: { type: String, required: true }
};

// Define the homestay schema
const homestaySchema = new Schema(
  {
    // Primary identification
    homestayId: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    
    // Digital Homestay Registration Number
    dhsrNo: {
      type: String,
      unique: true,
      sparse: true
    },
    
    // Basic homestay information
    homeStayName: { type: String, required: true },
    villageName: { type: String, required: true },
    homeCount: { type: Number, required: true, min: 1 },
    roomCount: { type: Number, required: true, min: 1 },
    bedCount: { type: Number, required: true, min: 1 },
    homeStayType: { type: String, required: true, enum: ['community', 'private'] },
    
    // Profile image
    profileImage: { type: String, default: null },
    
    // Gallery images for the portal
    galleryImages: { type: [String], default: [] },
    
    // Description for the portal
    description: { type: String, default: "" },
    
    // Directions
    directions: { type: String, default: "" },
    
    // Address (embedded document with bilingual support)
    address: {
      province: bilingualField,
      district: bilingualField,
      municipality: bilingualField,
      ward: bilingualField,
      city: { type: String, required: true },
      tole: { type: String, required: true },
      formattedAddress: bilingualField
    },
    
    // Features (embedded document)
    features: {
      localAttractions: { type: [String], default: [] },
      tourismServices: { type: [String], default: [] },
      infrastructure: { type: [String], default: [] },
    },
    
    // Status and metadata
    status: { 
      type: String, 
      required: true, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewCount: { type: Number, default: 0 },
    
    // References to officials and contacts
    officialIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Official' }],
    contactIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'Homestays Collection', // Use existing collection name
    strict: false // Allow additional fields for flexibility
  }
);

// Create text index for search
homestaySchema.index({
  homeStayName: "text",
  villageName: "text",
  "address.province.en": "text",
  "address.province.ne": "text",
  "address.district.en": "text",
  "address.district.ne": "text",
  "address.municipality.en": "text",
  "address.municipality.ne": "text",
  "address.city": "text",
  description: "text" // Add description to text search
});

// Clear existing model if in development to avoid schema conflicts
try {
  if (process.env.NODE_ENV !== 'production') {
    // Delete the model if it exists to allow schema changes during development
    if (mongoose.models.HomestaySingle) {
      delete mongoose.models.HomestaySingle;
    }
  }
} catch (error) {
  console.warn('Failed to delete existing model:', error);
}

// Create model (or return existing)
const HomestaySingle = mongoose.models.HomestaySingle || mongoose.model('HomestaySingle', homestaySchema);

export default HomestaySingle; 