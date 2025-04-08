import mongoose, { Schema, Document, models, Model } from 'mongoose';
// Fix import by using the default export and defining our own ILocation interface
import Location from "./Location";

// Define our own ILocation interface that matches what we need
interface ILocation {
  _id: mongoose.Types.ObjectId;
  province: { en: string; ne: string };
  district: { en: string; ne: string };
  municipality: { en: string; ne: string };
  ward: { en: string; ne: string };
  city: string;
  tole: string;
  formattedAddress: { en: string; ne: string };
  isVerified: boolean;
  homestayId: string;
}

// Define a simple schema for bilingual fields without requiring them to be string type
const bilingualField = {
  en: { type: String, required: true },
  ne: { type: String, required: true }
};

// Define interface for a single uploaded document file
interface IDocumentFile {
  originalName: string;
  filePath: string; // Path relative to public/uploads
  fileType: string;
  size: number;
}

// Define interface for a document entry (title, description, files)
interface IDocumentEntry {
  title: string;
  description?: string;
  uploadedAt: Date;
  files: IDocumentFile[];
}

// Interface for Homestay data
export interface IHomestaySingle extends Document {
  // Primary identification
  homestayId: string;
  password: string; // Added password field to match schema
  dhsrNo?: string;
  
  // Basic homestay information
  homeStayName: string;
  villageName: string;
  homeCount: number;
  roomCount: number;
  bedCount: number;
  homeStayType: 'community' | 'private';
  
  // Images
  profileImage?: string;
  galleryImages?: string[];
  
  // Description and directions
  description: string;
  directions?: string;
  
  // Address
  address: {
    province: { en: string; ne: string };
    district: { en: string; ne: string };
    municipality: { en: string; ne: string };
    ward: { en: string; ne: string };
    city: string;
    tole: string;
    formattedAddress: { en: string; ne: string };
  };
  
  // Features
  features?: {
    localAttractions: string[];
    tourismServices: string[];
    infrastructure: string[];
  };
  
  // Status and ratings
  status: 'pending' | 'approved' | 'rejected';
  averageRating?: number;
  reviewCount?: number;
  
  // References to other collections
  officialIds?: mongoose.Types.ObjectId[];
  contactIds?: mongoose.Types.ObjectId[];
  
  // Additional fields (some of these might be duplicated or unnecessary)
  name: string;
  city: string;
  district: string;
  province: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email?: string;
  website?: string;
  amenities: string[];
  pricePerNight?: number;
  numberOfRooms: number;
  maxGuests: number;
  rules?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  ownerName: string;
  ownerContact: string;
  ownerId?: string;
  isVerified?: boolean;
  rating?: number;
  reviews?: Schema.Types.ObjectId[];
  location?: ILocation['_id'];
  createdAt: Date;
  updatedAt: Date;
  registrationNumber?: string;
  registrationDate?: Date;
  isFeatured?: boolean;
  bookings?: Schema.Types.ObjectId[];
  availability?: {
    startDate: Date;
    endDate: Date;
    bookedDates: Date[];
  };
  contactPerson?: {
    name: string;
    phone: string;
    email?: string;
  };
  officialDocuments?: {
    registrationCert?: string;
    taxClearance?: string;
  };
  documents?: IDocumentEntry[];
}

// Define the homestay schema
const homestaySchema = new Schema<IHomestaySingle>(
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

    // New fields from the interface
    name: { type: String, required: true },
    country: { type: String, default: "Nepal" },
    latitude: { type: Number },
    longitude: { type: Number },
    phone: { type: String, required: true },
    email: { type: String },
    website: { type: String },
    amenities: [{ type: String }],
    pricePerNight: { type: Number },
    numberOfRooms: { type: Number, required: true },
    maxGuests: { type: Number, required: true },
    rules: [{ type: String }],
    checkInTime: { type: String },
    checkOutTime: { type: String },
    ownerName: { type: String, required: true },
    ownerContact: { type: String, required: true },
    ownerId: { type: String },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, min: 0, max: 5 },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    registrationNumber: { type: String },
    registrationDate: { type: Date },
    isFeatured: { type: Boolean, default: false },
    bookings: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
    availability: {
      startDate: Date,
      endDate: Date,
      bookedDates: [Date],
    },
    contactPerson: {
      name: String,
      phone: String,
      email: String,
    },
    officialDocuments: {
      registrationCert: String,
      taxClearance: String,
    },
    documents: [{
      title: { type: String, required: true },
      description: { type: String },
      uploadedAt: { type: Date, default: Date.now },
      files: [{
        originalName: { type: String, required: true },
        filePath: { type: String, required: true },
        fileType: { type: String, required: true },
        size: { type: Number, required: true },
      }]
    }],
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
const HomestaySingle = (models?.HomestaySingle as Model<IHomestaySingle>) || mongoose.model<IHomestaySingle>("HomestaySingle", homestaySchema);

export default HomestaySingle; 