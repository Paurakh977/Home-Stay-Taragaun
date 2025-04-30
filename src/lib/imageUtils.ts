/**
 * Utility functions for handling images across the application
 */

/**
 * Transforms an upload path to an API image path with cache busting
 * This function ensures images are always fresh and not cached by the browser
 * 
 * @param imagePath - The original image path from the database (e.g., /uploads/...)
 * @returns A properly formatted image URL for the API with cache busting
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) {
    return '/images/placeholder-homestay.jpg';
  }
  
  // If it's already a URL or an absolute path to images, return it as is
  if (imagePath.startsWith('http') || imagePath.startsWith('/images/')) {
    return imagePath;
  }
  
  // Transform /uploads/path/to/image.jpg to /api/images/path/to/image.jpg
  // This handles both admin paths (/uploads/adminUsername/homestayId/...)
  // and regular paths (/uploads/homestayId/...)
  if (imagePath.startsWith('/uploads/')) {
    const apiPath = imagePath.replace('/uploads/', '/api/images/');
    // Add cache busting timestamp to prevent browser caching
    return `${apiPath}?t=${Date.now()}`;
  }
  
  // Handle other paths
  return `/api/images/${imagePath}?t=${Date.now()}`;
}

/**
 * Return true if the path is likely to need API routing and cache busting
 * Used to determine when to set unoptimized=true on Next.js Image components
 */
export function shouldUseUnoptimizedImage(imagePath: string | null | undefined): boolean {
  if (!imagePath) return false;
  
  // Always use unoptimized for uploads and api paths
  return imagePath.startsWith('/uploads/') || 
         imagePath.startsWith('/api/images/') ||
         imagePath.includes('?t=');
} 