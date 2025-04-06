import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from 'crypto';

/**
 * Combines class names with tailwind-merge to prevent conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a unique homestay ID based on the homestay name
 * Format: lowercase name (without spaces) + random 3-digit number
 * Example: "Dhampus Homestay" -> "dhampus981"
 */
export function generateHomestayId(homestayName: string): string {
  // Remove spaces, special characters, and convert to lowercase
  const baseId = homestayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12); // Limit to 12 chars max
  
  // Add random 3-digit number
  const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
  
  return `${baseId}${randomNum}`;
}

/**
 * Generates a cryptographically secure random password
 * Creates a strong password with uppercase, lowercase, numbers and symbols
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed similar-looking chars
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // Removed similar-looking chars
  const numberChars = '23456789'; // Removed 0 and 1 (look like O and l)
  const specialChars = '@#$%^&*!';
  
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  
  // Generate random bytes and convert to string
  const getRandomChar = (charSet: string) => {
    const randomIndex = crypto.randomInt(0, charSet.length);
    return charSet.charAt(randomIndex);
  };
  
  // Ensure password contains at least one of each char type
  let password = '';
  password += getRandomChar(uppercaseChars);
  password += getRandomChar(lowercaseChars);
  password += getRandomChar(numberChars);
  password += getRandomChar(specialChars);
  
  // Fill the rest with random chars
  for (let i = password.length; i < length; i++) {
    password += getRandomChar(allChars);
  }
  
  // Shuffle the password (Fisher-Yates algorithm)
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  
  return passwordArray.join('');
}

/**
 * Securely hash a password for storage
 */
export function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
}
