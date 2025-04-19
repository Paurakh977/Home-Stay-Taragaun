import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Define JWT token payload interface
interface AdminTokenPayload {
  id?: string;
  userId: string;
  username: string;
  role: string;
  isAdmin: boolean;
  permissions?: Record<string, boolean>;
}

// Secret key for JWT verification
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_development';

/**
 * Verifies an admin token from a request
 * @param request NextRequest object
 * @returns Decoded token payload or null if invalid
 */
export async function verifyAdminToken(request: NextRequest): Promise<AdminTokenPayload | null> {
  try {
    // Get token from cookies
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    
    // Ensure it's an admin token
    if (!decoded.isAdmin) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return null;
  }
}

/**
 * Verifies a superadmin token from a request
 * @param request NextRequest object
 * @returns Decoded token payload or null if invalid
 */
export async function verifySuperadminToken(request: NextRequest): Promise<AdminTokenPayload | null> {
  try {
    // Get token from cookies
    const token = request.cookies.get('superadmin_token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    
    // Ensure it's a superadmin
    if (decoded.role !== 'superadmin') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error verifying superadmin token:', error);
    return null;
  }
} 