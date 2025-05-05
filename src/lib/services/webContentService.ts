import { connectToDatabase } from '../db';
import { WebContent, IWebContent, Navigation, INavigation } from '../models';

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
      const result = await WebContent.findOneAndUpdate(
        { adminUsername },
        { $set: contentData },
        { 
          new: true,
          upsert: true,
          runValidators: true
        }
      );
      
      return result;
    } catch (error) {
      console.error(`Error updating content for ${adminUsername}:`, error);
      throw error;
    }
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
      const updateData: any = {};
      updateData[section] = sectionData;
      
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
      return newContent;
    } catch (error) {
      console.error(`Error creating default content for ${adminUsername}:`, error);
      throw error;
    }
  }
}

export default WebContentService; 