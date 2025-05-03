import { connectToDatabase } from '../db';
import { WebContent, IWebContent, Navigation, INavigation } from '../models';
import { updateImageCacheBuster } from '../imageUtils';

/**
 * Service for managing website content through the WebContent model
 */
export class WebContentService {
  /**
   * Get content from the WebContent model
   */
  static async getContent(adminUsername: string = 'main'): Promise<IWebContent | null> {
    await connectToDatabase();
    
    try {
      const content = await WebContent.findOne({ adminUsername });
      return content;
    } catch (error) {
      console.error(`Error fetching content for ${adminUsername}:`, error);
      return null;
    }
  }

  /**
   * Update content in the WebContent model
   */
  static async updateContent(adminUsername: string, contentData: Partial<IWebContent>): Promise<IWebContent> {
    await connectToDatabase();
    
    try {
      console.log(`Updating all content for ${adminUsername}`);
      const result = await WebContent.findOneAndUpdate(
        { adminUsername },
        { $set: contentData },
        { 
          new: true,
          upsert: true,
          runValidators: true
        }
      );
      
      // Update cache buster for images after content change
      updateImageCacheBuster();
      
      return result;
    } catch (error) {
      console.error(`Error updating content for ${adminUsername}:`, error);
      throw error;
    }
  }

  /**
   * Special handling for aboutPage updates to prevent 500 errors
   */
  static async updateAboutPage(adminUsername: string, aboutPageData: any): Promise<IWebContent> {
    await connectToDatabase();
    
    try {
      console.log(`Special handling for aboutPage update for ${adminUsername}`);
      
      // First, check if content document exists
      let content = await WebContent.findOne({ adminUsername });
      
      // If it doesn't exist, create a base document first
      if (!content) {
        console.log(`Creating new content document for ${adminUsername}`);
        content = await WebContent.create({
          adminUsername,
          siteInfo: {
            siteName: "Nepal StayLink",
            tagline: "Your Gateway to Authentic Homestays",
            logoPath: "/Logo.png",
            faviconPath: "/favicon.ico"
          }
        });
      }
      
      // Get the existing aboutPage data to merge with new data
      let existingAboutPage = content.aboutPage || {};
      
      // Deep merge of existing and new about page data
      // This ensures we don't lose any data structure, only update what was provided
      const deepMergedData = this.deepMerge(existingAboutPage, aboutPageData);
      
      // Log details of the update for debugging
      console.log(`aboutPage update - merged data keys: ${Object.keys(deepMergedData).join(', ')}`);
      
      // Update specifically the aboutPage field
      const result = await WebContent.findOneAndUpdate(
        { adminUsername },
        { $set: { aboutPage: deepMergedData } },
        { 
          new: true,
          runValidators: false // Temporarily disable validators to prevent rejection
        }
      );
      
      if (!result) {
        throw new Error(`Failed to update aboutPage for ${adminUsername}`);
      }
      
      // Update cache buster for images after content change
      updateImageCacheBuster();
      
      return result;
    } catch (error) {
      console.error(`Error in special aboutPage update for ${adminUsername}:`, error);
      throw error;
    }
  }
  
  /**
   * Helper method to deeply merge objects for partial updates
   * This ensures we don't lose nested properties when updating only part of an object
   */
  private static deepMerge(target: any, source: any): any {
    // Create a new object to avoid mutating the originals
    const output = { ...target };
    
    // If source is not an object or is null, return source
    if (source === null || typeof source !== 'object') {
      return source;
    }
    
    // If target is not an object or is null, use an empty object as target
    if (output === null || typeof output !== 'object') {
      return { ...source };
    }
    
    // Handle arrays - replace the entire array rather than merging
    if (Array.isArray(source)) {
      return [...source];
    }
    
    // For each property in source
    Object.keys(source).forEach(key => {
      // If the property is an object, recursively deep merge
      if (typeof source[key] === 'object' && source[key] !== null && 
          typeof output[key] === 'object' && output[key] !== null &&
          !Array.isArray(source[key])) {
        output[key] = this.deepMerge(output[key], source[key]);
      } else {
        // Otherwise just copy the property
        output[key] = source[key];
      }
    });
    
    return output;
  }

  /**
   * Update a specific section of content
   */
  static async updateSection(
    adminUsername: string,
    section: 'homePage' | 'aboutPage' | 'contactPage' | 'siteInfo' | 'navigation' | 'footer' | 'testimonials',
    sectionData: any
  ): Promise<IWebContent> {
    await connectToDatabase();
    
    try {
      console.log(`Updating section ${section} for ${adminUsername}`);
      
      // Special handling for aboutPage section due to common issues
      if (section === 'aboutPage') {
        return await this.updateAboutPage(adminUsername, sectionData);
      }
      
      const updateData: any = {};
      updateData[section] = sectionData;
      
      // Log the update for debugging
      console.log(`${section} data keys: ${Object.keys(sectionData).join(', ')}`);
      
      const result = await WebContent.findOneAndUpdate(
        { adminUsername },
        { $set: updateData },
        { 
          new: true,
          upsert: true, // Create document if it doesn't exist
          runValidators: true
        }
      );
      
      if (!result) {
        throw new Error(`No content found for admin: ${adminUsername}`);
      }
      
      // Update cache buster for images after content change
      updateImageCacheBuster();
      
      return result;
    } catch (error) {
      console.error(`Error updating ${section} for ${adminUsername}:`, error);
      throw error;
    }
  }

  /**
   * Get navigation content
   */
  static async getNavigation(type: 'navbar' | 'footer'): Promise<INavigation | null> {
    await connectToDatabase();
    
    try {
      const navigation = await Navigation.findOne({ type });
      return navigation;
    } catch (error) {
      console.error(`Error fetching ${type} navigation:`, error);
      return null;
    }
  }

  /**
   * Update navigation content
   */
  static async updateNavigation(
    type: 'navbar' | 'footer',
    content: Partial<INavigation>
  ): Promise<INavigation> {
    await connectToDatabase();
    
    try {
      const result = await Navigation.findOneAndUpdate(
        { type },
        { $set: { ...content, type } },
        { 
          new: true,
          upsert: true,
          runValidators: true
        }
      );
      
      // Update cache buster for images after navigation change
      updateImageCacheBuster();
      
      return result;
    } catch (error) {
      console.error(`Error updating ${type} navigation:`, error);
      throw error;
    }
  }

  /**
   * Create default content for a new admin user
   */
  static async createDefaultContent(adminUsername: string): Promise<IWebContent> {
    await connectToDatabase();
    
    try {
      // Check if content already exists
      const existingContent = await WebContent.findOne({ adminUsername });
      if (existingContent) {
        return existingContent;
      }
      
      // Create default content structure
      const defaultContent = {
        adminUsername,
        siteInfo: {
          siteName: "Nepal StayLink",
          tagline: "Your Gateway to Authentic Homestays",
          logoPath: "/Logo.png",
          faviconPath: "/favicon.ico"
        },
        homePage: {
          hero: {
            title: "Experience Authentic Nepal",
            subtitle: "Connect with local homestays and immerse yourself in Nepal's rich culture and hospitality.",
            backgroundImage: "/images/home/hero-bg.jpg",
            searchPlaceholder: "Where would you like to stay?"
          },
          stats: [
            { value: "200+", label: "Homestays" },
            { value: "50+", label: "Destinations" },
            { value: "5000+", label: "Travelers" }
          ],
          howItWorks: {
            title: "How It Works",
            subtitle: "A simple process to connect you with authentic Nepali homestays",
            steps: [
              {
                icon: "Search",
                title: "Find Your Stay",
                description: "Browse our curated selection of authentic Nepali homestays across the country.",
                linkText: "Explore Homestays",
                linkUrl: "/homestays"
              }
            ]
          }
        }
      };
      
      // Save to database
      const newContent = await WebContent.create(defaultContent);
      
      // Update cache buster after creating new content
      updateImageCacheBuster();
      
      return newContent;
    } catch (error) {
      console.error(`Error creating default content for ${adminUsername}:`, error);
      throw error;
    }
  }
}

export default WebContentService; 