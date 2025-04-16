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
 * @returns A unique homestay ID that is SEO-friendly
 */
export function generateHomestayId(homeStayName: string): string {
  // Convert to lowercase and trim
  const cleanName = homeStayName
    .toLowerCase()
    .trim()
    // Replace non-alphanumeric and spaces with hyphens
    .replace(/[^a-z0-9]+/gi, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Replace multiple consecutive hyphens with a single one
    .replace(/-+/g, '-');
  
  // Use the full processed name rather than just first 8 chars
  // But add a short timestamp for uniqueness
  const shortId = Date.now().toString().slice(-4);
  
  return `${cleanName}-${shortId}`;
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
