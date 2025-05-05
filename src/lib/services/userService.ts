import User from '../models/User';
import dbConnect from '../mongodb';
import bcrypt from 'bcryptjs'; // Use bcryptjs instead of bcrypt

// Simple hash password function until we can find the proper import
async function hashPassword(password: string): Promise<string> {
  console.log('HASH DEBUG [userService]: Using hashPassword function');
  console.log(`HASH DEBUG [userService]: Password length: ${password.length}`);
  console.log(`HASH DEBUG [userService]: Password starts with: ${password.substring(0, 2)}...`);
  
  const salt = await bcrypt.genSalt(10);
  console.log(`HASH DEBUG [userService]: Generated salt: ${salt}`);
  
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(`HASH DEBUG [userService]: Hashed password length: ${hashedPassword.length}`);
  console.log(`HASH DEBUG [userService]: Hashed password starts with: ${hashedPassword.substring(0, 10)}...`);
  
  return hashedPassword;
}

// Define interfaces for better type safety
interface BrandingData {
  logo?: string;
  sliderImages?: string[];
  brandName?: string;
  brandDescription?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  team?: Array<{
    name: string;
    position: string;
    photo?: string;
  }>;
}

interface UserData {
  username: string;
  password?: string;
  email: string;
  contactNumber: string;
  role: string;
  isActive?: boolean;
  parentAdmin?: string;
  permissions?: Record<string, boolean>;
  logoPath?: string;
  sliderPaths?: string[];
  teamPhotoPaths?: string[];
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  brandName?: string;
  brandDescription?: string;
  address?: string;
  businessEmail?: string;
  phone?: string;
  story?: string;
  mission?: string;
  vision?: string;
  teamMembers?: Array<{
    name: string;
    position: string;
    photo?: string;
  }>;
  branding?: any;
  // Add flag to prevent double hashing
  skipPasswordHashing?: boolean;
}

/**
 * Fetch a user by username
 * @param username The username to look up
 * @returns The user object or null if not found
 */
export async function getUserByUsername(username: string) {
  try {
    await dbConnect();
    
    // Find user by username
    const user = await User.findOne({ username }).lean();
    
    // Convert permissions Map to a regular object if it exists
    if (user && user.permissions) {
      const permissionsObj: Record<string, boolean> = {};
      
      // Handle both Map and regular object formats
      // @ts-ignore - Handle MongoDB Map type which has get() and entries()
      if (typeof user.permissions.get === 'function') {
        // It's a Map
        // @ts-ignore - Handle MongoDB Map type
        for (const [key, value] of user.permissions.entries()) {
          permissionsObj[key] = value;
        }
      } else {
        // It's already an object
        Object.assign(permissionsObj, user.permissions);
      }
      
      user.permissions = permissionsObj;
    }
    
    return user;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    throw error;
  }
}

// Create user function
export async function createUser(userData: UserData) {
  try {
    console.log('USER CREATE DEBUG: Starting user creation');
    console.log(`USER CREATE DEBUG: Username: ${userData.username}, Role: ${userData.role}`);
    
    await dbConnect();

    // IMPORTANT: Fixed double hashing issue
    if (userData.password) {
      console.log(`USER CREATE DEBUG: Raw password length: ${userData.password.length}`);
      
      // We need to check if we should skip password hashing (already pre-hashed)
      if (!userData.skipPasswordHashing) {
        console.log('USER CREATE DEBUG: Hashing password in userService');
        
        // If we're creating an officer, the password should NOT be hashed here
        // because it will be hashed again in the User model pre-save hook
        if (userData.role === "officer") {
          // IMPORTANT: For officers, we'll set a flag on the data to skip the pre-save hook hashing
          // This flag will be used by the model's pre-save hook
          console.log('USER CREATE DEBUG: Officer role detected - setting _skipPasswordHashing flag');
          // @ts-ignore - Add custom property to the data that will be checked in pre-save hook
          userData._skipPasswordHashing = true;
        } else {
          // For non-officers, hash the password here
          userData.password = await hashPassword(userData.password);
          console.log(`USER CREATE DEBUG: Password hashed, new length: ${userData.password.length}`);
        }
      } else {
        console.log('USER CREATE DEBUG: Password hashing skipped (already hashed)');
      }
    }

    // For officer roles, ensure parentAdmin is set
    if (userData.role === "officer" && !userData.parentAdmin) {
      throw new Error("Officer must have a parent admin");
    }

    // Handle branding data for admin users
    if (userData.role === "admin") {
      // Create branding object that matches the User model schema structure
      const branding = {
        brandName: userData.brandName || "",
        brandDescription: userData.brandDescription || "",
        logoPath: userData.logoPath || "",
        sliderImages: userData.sliderPaths || [],
        contactInfo: {
          address: userData.address || "",
          email: userData.businessEmail || "",
          phone: userData.phone || "",
          socialLinks: {
            facebook: userData.facebook || "",
            instagram: userData.instagram || "",
            twitter: userData.twitter || "",
            tiktok: userData.tiktok || "",
            youtube: userData.youtube || "",
          }
        },
        aboutUs: {
          story: userData.story || "",
          mission: userData.mission || "",
          vision: userData.vision || "",
          team: userData.teamMembers ? userData.teamMembers.map((member, index) => ({
            name: member.name || "",
            role: member.position || "",
            photoPath: userData.teamPhotoPaths?.[index] || "",
          })) : []
        }
      };

      // Add branding to user data
      userData.branding = branding;
      
      console.log("Structured branding data:", JSON.stringify(branding, null, 2));
    }

    // Delete unnecessary fields
    delete userData.logoPath;
    delete userData.sliderPaths;
    delete userData.teamPhotoPaths;
    delete userData.facebook;
    delete userData.instagram;
    delete userData.twitter;
    delete userData.tiktok;
    delete userData.youtube;
    delete userData.brandName;
    delete userData.brandDescription;
    delete userData.teamMembers;
    delete userData.address;
    delete userData.businessEmail;
    delete userData.phone;
    delete userData.story;
    delete userData.mission;
    delete userData.vision;
    delete userData.skipPasswordHashing; // Remove this flag before saving

    // Create new user
    console.log('USER CREATE DEBUG: Creating user in database');
    const newUser = await User.create(userData);
    console.log(`USER CREATE DEBUG: User created with ID: ${newUser._id}`);
    
    // Verify password hash was saved correctly
    const createdUser = await User.findById(newUser._id).select('+password');
    if (createdUser) {
      console.log('USER CREATE DEBUG: Password verification');
      console.log(`USER CREATE DEBUG: Final password hash in DB: ${createdUser.password.substring(0, 10)}...`);
      
      // If the original plain password was provided, test it
      if (userData.password && userData.password.length < 30) { // Assuming plain passwords are shorter than 30 chars
        const testResult = await bcrypt.compare(userData.password, createdUser.password);
        console.log(`USER CREATE DEBUG: Test password verification result: ${testResult}`);
      }
    }
    
    return newUser;
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create user");
  }
}

// Update user function
export async function updateUser(userId: string, userData: UserData) {
  try {
    await dbConnect();

    // Get existing user to update
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Hash password if provided
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }

    // Handle branding data for admin users
    if (userData.role === "admin") {
      // Get existing branding data or initialize empty object
      const existingBranding = existingUser.branding as BrandingData || {};
      
      // Update branding object
      const branding: BrandingData = {
        logo: userData.logoPath || existingBranding.logo || "",
        sliderImages: userData.sliderPaths || existingBranding.sliderImages || [],
        brandName: userData.brandName || existingBranding.brandName || "",
        brandDescription: userData.brandDescription || existingBranding.brandDescription || "",
        socialMedia: {
          facebook: userData.facebook || (existingBranding.socialMedia?.facebook || ""),
          instagram: userData.instagram || (existingBranding.socialMedia?.instagram || ""),
          twitter: userData.twitter || (existingBranding.socialMedia?.twitter || ""),
          tiktok: userData.tiktok || (existingBranding.socialMedia?.tiktok || ""),
          youtube: userData.youtube || (existingBranding.socialMedia?.youtube || ""),
        },
      };

      // Handle team members
      if (userData.teamMembers && userData.teamMembers.length > 0) {
        branding.team = userData.teamMembers.map((member, index) => {
          // Get existing team member photo if available
          const existingTeamPhoto = existingBranding.team && 
                                   existingBranding.team[index] ? 
                                   existingBranding.team[index].photo : 
                                   "";
          
          return {
            name: member.name || "",
            position: member.position || "",
            photo: userData.teamPhotoPaths?.[index] || existingTeamPhoto || "",
          };
        });
      } else if (existingBranding.team) {
        // Keep existing team if no new team data
        branding.team = existingBranding.team;
      }

      // Add branding to user data
      userData.branding = branding;
    }

    // Delete unnecessary fields
    delete userData.logoPath;
    delete userData.sliderPaths;
    delete userData.teamPhotoPaths;
    delete userData.facebook;
    delete userData.instagram;
    delete userData.twitter;
    delete userData.tiktok;
    delete userData.youtube;
    delete userData.brandName;
    delete userData.brandDescription;
    delete userData.teamMembers;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: userData },
      { new: true }
    );

    return updatedUser;
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update user");
  }
} 