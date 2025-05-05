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

// Define interface for a team member
interface ITeamMember {
  name: string;
  position: string;
  contactNo?: string;
  photoPath: string;
  bio: string;
  order: number;
}

// Define interface for a destination
interface IDestination {
  name: string;
  description: string;
  distance: string;
  image: string;
  category: string;
  highlights: string[];
}

// Define interface for a testimonial
interface ITestimonial {
  name: string;
  location: string;
  rating: number;
  quote: string;
  photoPath: string;
  date: Date;
}

// Define interface for page content sections
interface IPageContent {
  aboutPage?: {
    title?: string;
    subtitle?: string;
    description?: string;
    mission?: string;
    vision?: string;
    backgroundImage?: string;
    highlightPoints?: string[];
  };
  contactPage?: {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
    formTitle?: string;
    mapEmbedUrl?: string;
    faq?: {
      question: string;
      answer: string;
    }[];
  };
  heroSection?: {
    slogan?: string;
    welcomeMessage?: string;
  };
  whyChooseUs?: string[];
}

// Interface for Homestay data
export interface IHomestaySingle extends Document {
  // Primary identification
  homestayId: string;
  password: string; // Added password field to match schema
  dhsrNo?: string;
  adminUsername: string; // Added admin username field for multi-tenant support
  
  // Basic homestay information
  homeStayName: string;
  villageName: string;
  homeCount: number;
  roomCount: number;
  bedCount: number;
  homeStayType: 'community' | 'private';
  
  // Feature access permissions
  featureAccess?: {
    dashboard?: boolean;
    profile?: boolean;
    portal?: boolean;
    documents?: boolean;
    imageUpload?: boolean;
    settings?: boolean;
    chat?: boolean;
    updateInfo?: boolean;
  };
  
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
    startDate?: Date;
    endDate?: Date;
    bookedDates?: Date[];
  };
  contactPerson?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  officialDocuments?: {
    registrationCert?: string;
    taxClearance?: string;
  };
  documents?: IDocumentEntry[];
  isAdmin?: boolean;
  
  // Custom fields defined by superadmin
  customFields?: {
    definitions: {
      fieldId: string;
      label: string;
      type: 'text' | 'number' | 'date' | 'boolean' | 'select';
      options?: string[]; // For select type
      required: boolean;
      addedBy: string; // superadmin username
      addedAt: Date;
    }[];
    values: {
      [fieldId: string]: any; // Dynamic values for the custom fields
      lastUpdated?: Date;
      reviewed?: boolean;
      reviewedBy?: string;
      reviewedAt?: Date;
    };
  };
  
  // Team members
  teamMembers?: ITeamMember[];
  
  // Destinations near homestay
  destinations?: IDestination[];
  
  // Page-specific content
  pageContent?: IPageContent;
  
  // Testimonials
  testimonials?: ITestimonial[];
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
    adminUsername: {
      type: String,
      required: true,
      index: true, // Add index for faster filtering by admin
      trim: true
    },
    
    // Feature access permissions
    featureAccess: {
      type: Map,
      of: Boolean,
      default: function() {
        // Return a new object every time to ensure clean defaults
        return {
          dashboard: false,
          profile: false,
          portal: false,
          documents: false,
          imageUpload: false,
          settings: false,
          chat: false,
          updateInfo: false
        };
      }
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

    // Additional fields from the interface
    // These are properly handled by strict: false and the defaults set above
    name: { type: String, required: false, default: "" },
    city: { type: String, required: false, default: "" },
    district: { type: String, required: false, default: "" },
    province: { type: String, required: false, default: "" },
    country: { type: String, default: "Nepal" },
    latitude: { type: Number },
    longitude: { type: Number },
    phone: { type: String, required: false, default: "" },
    email: { type: String },
    website: { type: String },
    amenities: [{ type: String }],
    pricePerNight: { type: Number },
    numberOfRooms: { type: Number, required: false, default: 0 },
    maxGuests: { type: Number, required: false, default: 0 },
    rules: [{ type: String }],
    checkInTime: { type: String },
    checkOutTime: { type: String },
    ownerName: { type: String, required: false, default: "" },
    ownerContact: { type: String, required: false, default: "" },
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
    isAdmin: {
      type: Boolean,
      default: false
    },
    
    // Custom fields
    customFields: {
      definitions: [{
        fieldId: { type: String, required: true },
        label: { type: String, required: true },
        type: { 
          type: String, 
          required: true,
          enum: ['text', 'number', 'date', 'boolean', 'select']
        },
        options: [String], // For select type
        required: { type: Boolean, default: false },
        addedBy: { type: String, required: true },
        addedAt: { type: Date, default: Date.now }
      }],
      values: {
        type: Map,
        of: Schema.Types.Mixed,
        default: () => new Map()
      }
    },
    
    // Team members
    teamMembers: [{
      name: { type: String, required: true },
      position: { type: String, required: true },
      contactNo: { type: String },
      photoPath: { type: String, required: true },
      bio: { type: String, required: true },
      order: { type: Number, default: 0 }
    }],
    
    // Destinations near homestay
    destinations: [{
      name: { type: String, required: true },
      description: { type: String, required: true },
      distance: { type: String, required: true },
      image: { type: String, required: true },
      category: { type: String, required: true },
      highlights: [{ type: String }]
    }],
    
    // Page-specific content
    pageContent: {
      aboutPage: {
        title: { type: String },
        subtitle: { type: String },
        description: { type: String },
        mission: { type: String },
        vision: { type: String },
        backgroundImage: { type: String },
        highlightPoints: [{ type: String }]
      },
      contactPage: {
        title: { type: String },
        subtitle: { type: String },
        backgroundImage: { type: String },
        formTitle: { type: String },
        mapEmbedUrl: { type: String },
        faq: [{
          question: { type: String, required: true },
          answer: { type: String, required: true }
        }]
      },
      heroSection: {
        slogan: { type: String },
        welcomeMessage: { type: String }
      },
      whyChooseUs: [{ type: String }]
    },
    
    // Testimonials
    testimonials: [{
      name: { type: String, required: true },
      location: { type: String, required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      quote: { type: String, required: true },
      photoPath: { type: String, required: true },
      date: { type: Date, default: Date.now }
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