/**
 * Utility functions for handling images across the application
 */

// Store an application-level timestamp that gets updated whenever content changes
// This ensures all components use the same timestamp until a content update occurs
let globalCacheBuster = Date.now();

// Keep track of when the cache buster was last updated to prevent frequent updates
let lastCacheBusterUpdate = Date.now();

/**
 * Update the global cache buster - call this after content updates
 * Has a debounce built in to prevent too frequent updates
 */
export function updateImageCacheBuster(): void {
  const now = Date.now();
  // Prevent updating more than once every 5 seconds
  if (now - lastCacheBusterUpdate < 5000) {
    console.log(`🔄 Image Cache Buster update skipped (last update was ${now - lastCacheBusterUpdate}ms ago)`);
    return;
  }
  
  globalCacheBuster = now;
  lastCacheBusterUpdate = now;
  console.log(`🔄 Image Cache Buster updated: ${globalCacheBuster}`);
}

/**
 * Special handling for logo paths, which might be referenced in different ways
 */
function normalizeLogoPath(imagePath: string): string {
  // Special case for Logo.png which might be referenced differently
  if (imagePath.toLowerCase().includes('logo.png')) {
    // Ensure we use a consistent path for the logo
    if (!imagePath.startsWith('/')) {
      return `/api/images/Logo.png?v=${globalCacheBuster}`;
    }
    
    // If it's already a path, make sure it's properly routed
    if (imagePath.startsWith('/uploads/')) {
      return imagePath.replace('/uploads/', '/api/images/') + `?v=${globalCacheBuster}`;
    }
  }
  
  return imagePath;
}

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
  
  try {
    // Normalize logo paths
    const normalizedPath = normalizeLogoPath(imagePath);
    if (normalizedPath !== imagePath) {
      return normalizedPath;
    }
    
    // If it's already a URL, return it as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // For static images in the public/images directory
    if (imagePath.startsWith('/images/')) {
      return `${imagePath}?v=${globalCacheBuster}`;
    }
    
    // For direct upload paths - these need to be transformed to API routes
    // This is important because Next.js doesn't serve files from /public/uploads directly in production
    if (imagePath.startsWith('/uploads/')) {
      // Transform /uploads/path/to/image.jpg to /api/images/path/to/image.jpg
      const apiPath = imagePath.replace('/uploads/', '/api/images/');
      // Add cache busting using global timestamp
      return `${apiPath}?v=${globalCacheBuster}`;
    }
    
    // If we're just given a filename (possibly from a database/API response)
    if (!imagePath.startsWith('/')) {
      const isInCMSFolder = imagePath.includes('cms/');
      
      // If it's likely from the CMS directory
      if (isInCMSFolder) {
        return `/api/images/${imagePath}?v=${globalCacheBuster}`;
      }
      
      // For other filenames, assume they're in the uploads directory
      return `/api/images/cms/${imagePath}?v=${globalCacheBuster}`;
    }
    
    // For any other case, prefix with api/images and add cache busting
    return `/api/images${imagePath}?v=${globalCacheBuster}`;
  } catch (error) {
    console.error('Error in getImageUrl:', error);
    // Return a fallback image path if anything goes wrong
    return `/api/fallback-image?type=placeholder&v=${globalCacheBuster}`;
  }
}

/**
 * Return true if the path is likely to need API routing and cache busting
 * Used to determine when to set unoptimized=true on Next.js Image components
 */
export function shouldUseUnoptimizedImage(imagePath: string | null | undefined): boolean {
  if (!imagePath) return false;
  
  // Always use unoptimized for uploads and api paths
  // This is important to ensure proper rendering in both dev and production
  return true;
} 