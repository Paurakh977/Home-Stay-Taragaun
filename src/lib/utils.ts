import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createHash } from 'crypto';

/**
 * Combines class names (className) with Tailwind CSS classes
 * @param inputs - Class names to combine
 * @returns Combined class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a homestay ID based on the homestay name
 * @param homeStayName - The name of the homestay
 * @returns A unique homestay ID
 */
export function generateHomestayId(homeStayName: string): string {
  // Clean the homestay name, remove spaces and special characters
  const cleanName = homeStayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/gi, '');
  
  // Take the first 8 characters of the cleaned name
  const namePrefix = cleanName.substring(0, 8);
  
  // Generate a timestamp suffix (last 6 characters of milliseconds)
  const timestamp = Date.now().toString().slice(-6);
  
  // Combine with a separator
  return `${namePrefix}-${timestamp}`;
}

/**
 * Generates a secure password for new homestays
 * @returns A secure random password
 */
export function generateSecurePassword(): string {
  const length = 10;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Hashes a password using SHA-256
 * @param password - The password to hash
 * @returns Hashed password
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Verify a password against a stored hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const hashedInput = hashPassword(password);
  return hashedInput === hashedPassword;
}
