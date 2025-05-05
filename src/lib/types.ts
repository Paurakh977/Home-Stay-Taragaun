// HomeStay types
export interface IOfficial {
  name: string;
  role: string;
  contactNo: string;
}

export interface IContact {
  name: string;
  mobile: string;
  facebook?: string;
  email?: string;
  youtube?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
}

export interface IHomeStay {
  // Basic info
  homeStayName: string;
  villageName: string;
  homeCount: number;
  roomCount: number;
  bedCount: number;
  homeStayType: 'community' | 'private';
  
  // Directions
  directions?: string;
  
  // Officials
  officials: IOfficial[];
  
  // Address
  province: string;
  district: string;
  municipality: string;
  ward: string;
  city: string;
  tole: string;
  
  // Features
  localAttractions: string[];
  tourismServices: string[];
  infrastructure: string[];
  
  // Contact info
  contacts: IContact[];
  
  // Status and dates
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  
  // Optional fields
  images?: string[];
  priceRange?: string;
  description?: string;
  rating?: number;
  reviews?: {
    user: string;
    comment: string;
    rating: number;
    date: Date;
  }[];
} 