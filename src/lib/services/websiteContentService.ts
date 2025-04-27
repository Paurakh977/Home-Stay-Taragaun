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
    section: 'homePage' | 'aboutPage' | 'contactPage' | 'siteInfo' | 'navigation' | 'footer',
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
          upsert: false,
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
}

export default WebContentService; 