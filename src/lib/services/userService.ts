import User from '../models/User';
import dbConnect from '../mongodb';

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