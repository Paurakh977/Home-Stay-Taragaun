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
  console.log(`PASSWORD DEBUG [${this.username}]: Pre-save hook called`);
  
  // Check for the skip flag (used in userService.createUser for officers)
  // @ts-ignore - Check for our custom property
  if (this._skipPasswordHashing) {
    console.log(`PASSWORD DEBUG [${this.username}]: Skipping password hash due to _skipPasswordHashing flag`);
    // @ts-ignore - Remove the flag so it doesn't get stored in DB
    delete this._skipPasswordHashing;
    return next();
  }
  
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    console.log(`PASSWORD DEBUG [${this.username}]: Password not modified, skipping hash`);
    return next();
  }

  try {
    console.log(`PASSWORD DEBUG [${this.username}]: Hashing password started`);
    console.log(`PASSWORD DEBUG [${this.username}]: Plain password length: ${this.password.length}`);
    console.log(`PASSWORD DEBUG [${this.username}]: First two chars: ${this.password.substring(0, 2)}, Last two chars: ${this.password.substring(this.password.length - 2)}`);
    
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    console.log(`PASSWORD DEBUG [${this.username}]: Generated salt: ${salt}`);
    
    const hashedPassword = await bcrypt.hash(this.password, salt);
    console.log(`PASSWORD DEBUG [${this.username}]: Hashed password length: ${hashedPassword.length}`);
    console.log(`PASSWORD DEBUG [${this.username}]: Hash prefix: ${hashedPassword.substring(0, 10)}...`);
    
    this.password = hashedPassword;
    console.log(`PASSWORD DEBUG [${this.username}]: Password hashing completed`);
    next();
  } catch (error: any) {
    console.error(`PASSWORD DEBUG [${this.username}]: Error hashing password:`, error);
    next(error);
  }
});

// Method to compare entered password with the hashed password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  console.log(`PASSWORD COMPARE DEBUG [${this.username}]: Starting password comparison`);
  console.log(`PASSWORD COMPARE DEBUG [${this.username}]: Entered password length: ${enteredPassword.length}`);
  console.log(`PASSWORD COMPARE DEBUG [${this.username}]: First two chars: ${enteredPassword.substring(0, 2)}, Last two chars: ${enteredPassword.substring(enteredPassword.length - 2)}`);
  console.log(`PASSWORD COMPARE DEBUG [${this.username}]: Stored hash length: ${this.password.length}`);
  console.log(`PASSWORD COMPARE DEBUG [${this.username}]: Stored hash prefix: ${this.password.substring(0, 10)}...`);
  
  const isMatch = await bcrypt.compare(enteredPassword, this.password);
  
  console.log(`PASSWORD COMPARE DEBUG [${this.username}]: Password match result: ${isMatch}`);
  return isMatch;
};


// Create model (check if it exists first to prevent overwrite during hot reload)
const User = (models?.User as Model<IUser>) || mongoose.model<IUser>('User', userSchema);

export default User; 