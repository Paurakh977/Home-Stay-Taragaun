import mongoose, { Schema } from 'mongoose';

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
    
    // Basic homestay information
    homeStayName: { type: String, required: true },
    villageName: { type: String, required: true },
    homeCount: { type: Number, required: true, min: 1 },
    roomCount: { type: Number, required: true, min: 1 },
    bedCount: { type: Number, required: true, min: 1 },
    homeStayType: { type: String, required: true, enum: ['community', 'private'] },
    
    // Directions
    directions: { type: String, required: true },
    
    // Address (embedded document)
    address: {
      province: { type: String, required: true },
      district: { type: String, required: true },
      municipality: { type: String, required: true },
      ward: { type: String, required: true },
      city: { type: String, required: true },
      tole: { type: String, required: true }
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
    collection: 'Homestays Collection' // Use existing collection name
  }
);

// Create text index for search
homestaySchema.index({
  homeStayName: "text",
  villageName: "text",
  "address.province": "text",
  "address.district": "text",
  "address.municipality": "text",
  "address.city": "text",
});

// Check if model exists before creating to prevent overwrite during development
const HomestaySingle = mongoose.models.HomestaySingle || mongoose.model('HomestaySingle', homestaySchema);

export default HomestaySingle; 