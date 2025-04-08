/**
 * Plain TypeScript interfaces mirroring Mongoose models but without Document methods.
 * Used for API responses and frontend state.
 */

// Base types
export interface BilingualData {
  en: string;
  ne: string;
}

export interface AddressData {
  province: BilingualData;
  district: BilingualData;
  municipality: BilingualData;
  ward: BilingualData;
  city: string;
  tole: string;
  formattedAddress: BilingualData;
}

export interface FeaturesData {
  localAttractions: string[];
  tourismServices: string[];
  infrastructure: string[];
}

export interface DocumentFileData {
  originalName: string;
  filePath: string; 
  fileType: string;
  size: number;
}

export interface DocumentEntryData {
  _id?: string; // Mongoose might add _id to subdocuments
  title: string;
  description?: string;
  uploadedAt: string | Date; // Allow string from JSON or Date object
  files: DocumentFileData[];
}

// Main Homestay Data Type
export interface HomestayData {
  _id: string; // Typically included from MongoDB
  homestayId: string;
  password?: string; // Usually excluded from API responses
  dhsrNo?: string;
  homeStayName: string;
  villageName: string;
  homeCount: number;
  roomCount: number;
  bedCount: number;
  homeStayType: 'community' | 'private';
  profileImage?: string;
  galleryImages?: string[];
  description: string;
  directions?: string;
  address: AddressData;
  features?: FeaturesData;
  status: 'pending' | 'approved' | 'rejected';
  averageRating?: number;
  reviewCount?: number;
  officialIds?: string[]; // Represent ObjectIds as strings
  contactIds?: string[]; // Represent ObjectIds as strings
  name: string; // Consider if this is needed, might be same as homeStayName
  city: string; // Likely redundant with address.city
  district: string; // Likely redundant with address.district
  province: string; // Likely redundant with address.province
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
  reviews?: string[]; // Represent ObjectIds as strings
  location?: string; // Represent ObjectId as string
  createdAt: string | Date;
  updatedAt: string | Date;
  registrationNumber?: string;
  registrationDate?: string | Date;
  isFeatured?: boolean;
  bookings?: string[]; // Represent ObjectIds as strings
  availability?: {
    startDate?: string | Date;
    endDate?: string | Date;
    bookedDates?: (string | Date)[];
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
  documents?: DocumentEntryData[];
  isAdmin?: boolean;
} 