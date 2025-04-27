import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Define type for navigation items
export interface INavItem {
  name: string;
  path: string;
  order?: number;
  isExternal?: boolean;
}

// Define type for navigation column in footer
export interface INavColumn {
  title: string;
  order: number;
  links: INavItem[];
}

// Define type for brand info
export interface IBrand {
  name: string;
  logo: string;
  tagline?: string;
}

// Define social link
export interface ISocialLink {
  platform: string;
  url: string;
}

// Main navigation interface
export interface INavigation extends Document {
  type: 'navbar' | 'footer';
  brand: IBrand;
  navItems?: INavItem[];
  description?: string;
  socialLinks?: ISocialLink[];
  columns?: INavColumn[];
  contactInfo?: {
    address: string;
    email: string;
    phone: string;
  };
  newsletterEnabled?: boolean;
  newsletterTitle?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  bottomLinks?: INavItem[];
  copyright?: string;
  updatedAt: Date;
  createdAt: Date;
}

// Define schema
const navigationSchema = new Schema<INavigation>({
  type: {
    type: String,
    enum: ['navbar', 'footer'],
    required: true,
    unique: true,
    index: true
  },
  
  brand: {
    name: { type: String, required: true },
    logo: { type: String, required: true },
    tagline: { type: String }
  },
  
  navItems: [{
    name: { type: String, required: true },
    path: { type: String, required: true },
    order: { type: Number, default: 0 },
    isExternal: { type: Boolean, default: false }
  }],
  
  description: { type: String },
  
  socialLinks: [{
    platform: { type: String, required: true },
    url: { type: String, required: true }
  }],
  
  columns: [{
    title: { type: String, required: true },
    order: { type: Number, required: true },
    links: [{
      name: { type: String, required: true },
      path: { type: String, required: true },
      isExternal: { type: Boolean, default: false }
    }]
  }],
  
  contactInfo: {
    address: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  
  newsletterEnabled: { type: Boolean, default: false },
  newsletterTitle: { type: String },
  newsletterPlaceholder: { type: String },
  newsletterButtonText: { type: String },
  
  bottomLinks: [{
    name: { type: String, required: true },
    path: { type: String, required: true },
    isExternal: { type: Boolean, default: false }
  }],
  
  copyright: { type: String }
}, {
  timestamps: true,
  collection: 'Navigation'
});

// Create or retrieve the model
const Navigation = (models?.Navigation as Model<INavigation>) || 
  mongoose.model<INavigation>('Navigation', navigationSchema);

export default Navigation; 