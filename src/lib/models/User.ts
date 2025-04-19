import mongoose, { Schema, models, Model, Document } from 'mongoose';
import bcrypt from 'bcryptjs'; // Import bcryptjs for password hashing

// Interface for User data
export interface IUser extends Document {
  username: string;
  password: string; // Store hashed password
  email: string; // Added email field
  contactNumber: string; // Added contact number field
  role: 'superadmin' | 'admin' | 'officer' | string; // Updated to include officer role
  isActive?: boolean; // Whether the account is active
  parentAdmin?: string; // For officers: reference to the admin they belong to
  permissions?: {
    // Admin Panel Permissions
    adminDashboardAccess?: boolean;
    homestayApproval?: boolean;
    homestayEdit?: boolean;
    homestayDelete?: boolean;
    documentUpload?: boolean;
    imageUpload?: boolean;
    // Any other permissions
  };
  // Admin branding fields
  branding?: {
    brandName: string;
    brandDescription: string;
    logoPath: string;
    sliderImages: string[];
    contactInfo: {
      address: string;
      email: string;
      phone: string;
      socialLinks: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        tiktok?: string;
        youtube?: string;
      };
    };
    aboutUs: {
      story: string;
      mission: string;
      vision: string;
      team: Array<{
        name: string;
        role: string;
        photoPath?: string;
      }>;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Define the user schema
const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [4, 'Password must be at least 4 characters long'], // Enforce minimum length
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['superadmin', 'admin', 'officer'], // Updated to include officer role
      default: 'admin', // Default role
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    parentAdmin: {
      type: String,
    },
    permissions: {
      type: Map,
      of: Boolean,
      default: function() {
        // Return a new object every time to ensure clean defaults
        return {
          adminDashboardAccess: false,
          homestayApproval: false,
          homestayEdit: false,
          homestayDelete: false,
          documentUpload: false,
          imageUpload: false
        };
      }
    },
    // Admin branding fields (only required for 'admin' role)
    branding: {
      type: {
        brandName: {
          type: String,
          trim: true,
        },
        brandDescription: {
          type: String,
          trim: true,
        },
        logoPath: {
          type: String,
          trim: true,
        },
        sliderImages: {
          type: [String],
          default: [],
        },
        contactInfo: {
          address: {
            type: String,
            trim: true,
          },
          email: {
            type: String,
            trim: true,
          },
          phone: {
            type: String,
            trim: true,
          },
          socialLinks: {
            facebook: String,
            instagram: String,
            twitter: String,
            tiktok: String,
            youtube: String,
          },
        },
        aboutUs: {
          story: {
            type: String,
            trim: true,
          },
          mission: {
            type: String,
            trim: true,
          },
          vision: {
            type: String,
            trim: true,
          },
          team: [{
            name: String,
            role: String,
            photoPath: String,
          }],
        },
      },
      required: function(this: any) {
        // Only required for admin role
        return this.role === 'admin';
      }
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'Users', // Specify collection name
  }
);

// Pre-save hook to hash password before saving
userSchema.pre<IUser>('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare entered password with the hashed password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};


// Create model (check if it exists first to prevent overwrite during hot reload)
const User = (models?.User as Model<IUser>) || mongoose.model<IUser>('User', userSchema);

export default User; 