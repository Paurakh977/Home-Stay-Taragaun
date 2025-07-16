import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import HomestaySingle from "@/lib/models/HomestaySingle";

// Map old attraction values to new values
const attractionMappings: Record<string, string> = {
  // Natural Attractions
  "Chitwan National Park/चितवन राष्ट्रिय निकुञ्ज": "National Parks & Conservation Areas/राष्ट्रिय निकुञ्ज तथा संरक्षित क्षेत्र",
  "Nepal's deepest and widest Narayani River/नेपालकै गहिरो तथा विशाल नारायणी नदी": "Major Rivers & Lakes/प्रमुख नदी तथा तालहरू",
  "Fish Pond/माछा पोखरी": "Ponds/पोखरी",
  
  // Cultural Heritage
  "Indigenous Tharu Museum/आदिवासी थारू संग्रहालय": "Museums & Cultural Centers/आदिवासी संग्रहालय तथा संस्कृति केन्द्रहरू",
  "Culture of local Tharu, Bote, and Musahar communities/स्थानीय थारू, बोटे र मुसहर समुदायको संस्कृति": "Traditional Festivals, Dances & Rituals/परम्परागत पर्व, नाच तथा विधिहरू",
  "Traditional food and culture of the Tharu community/थारू समुदायको परम्परागत भोजन र संस्कृति": "Local Community Lifestyle & Architecture/स्थानीय जीवनशैली तथा वास्तुकला",
  
  // Organic & Local Products
  "Traditional Dishes: Chichar, Dhikri, Ghoghi, Mod, Nijai, etc./परम्परागत खाना: चिचर, ढिकरी, घोगी, मोद, निजई आदि": "Traditional Dishes & Recipes/परम्परागत परिकारहरू",
  
  // Community Forest & Trails
  "Gunddahi Dhakaha Community Forest/गुन्द्धही ढकाहा सामुदायिक वन": "Community-managed Forests/सामुदायिक वन क्षेत्रहरू",
  "Community Forest Trekking Trail/सामुदायिक वन पदयात्रा मार्ग": "Nature Walks & Eco Trails/प्रकृति पदमार्ग तथा पदयात्रा",
  
  // Wildlife & Birdwatching
  "One-horned Rhinoceros/एक सिङ्गे गैडा": "Iconic & Endangered Wildlife/प्रमुख तथा लोपोन्मुख जनावरहरू",
  "Royal Bengal Tiger/पाटेबाघ": "Birdwatching Hotspots/चराचुरुङ्गी हेर्ने स्थानहरू",
  "Gharial Crocodile/घडियाल": "Community-led Wildlife Conservation/सामुदायिक वन्यजन्तु संरक्षण प्रयासहरू",
  
  // Adventure & Eco-tourism Activities
  "Himalayan Climbing and Trekking/हिमाली आरोहण तथा ट्रेकिङ": "Trekking, Climbing & Hiking Routes/ट्रेकिङ, आरोहण तथा हाइकिङ मार्गहरू",
  "Tharu village tour, cycling, mobile cart ride/थारू गाउँ सयर (भिलेज वाक), साइकल यात्रा, मोबाइल गाडा सयर": "Jungle Walks & Wildlife Safaris/जंगल पदयात्रा तथा सफारी",
  "Sunset viewing from the Narayani riverside/नारायणी नदीको किनारबाट सूर्यास्त दृश्य अवलोकन": "Sunset/Sunrise Viewing Points/सूर्यास्त/सूर्योदय हेर्ने स्थानहरू",
  "Elephant Bathing/हात्ती बाथ": "Cultural Village Tours, Cycling & Local Mobility/गाउँ सयर, साइकल यात्रा, स्थानीय सवारी अनुभव"
};

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await dbConnect();
    
    // Find all homestays with attractions
    const homestays = await HomestaySingle.find({
      'features.localAttractions': { $exists: true, $not: { $size: 0 } }
    });
    
    console.log(`Found ${homestays.length} homestays with attractions to update`);
    
    // Track migration stats
    const results = {
      totalHomestays: homestays.length,
      updated: 0,
      unchanged: 0,
      details: [] as Array<{
        homestayId: string;
        updated: boolean;
        oldCount?: number;
        newCount?: number;
      }>
    };
    
    // Process each homestay
    for (const homestay of homestays) {
      const originalAttractions = homestay.features?.localAttractions || [];
      const updatedAttractions = originalAttractions.map((attraction: string) => 
        attractionMappings[attraction] || attraction
      );
      
      // Check if any attractions were updated
      const hasChanges = JSON.stringify(originalAttractions) !== JSON.stringify(updatedAttractions);
      
      // Add to results
      results.details.push({
        homestayId: homestay.homestayId,
        updated: hasChanges,
        oldCount: originalAttractions.length,
        newCount: updatedAttractions.length
      });
      
      if (hasChanges) {
        // Update the homestay with new attraction values
        if (homestay.features) {
          homestay.features.localAttractions = updatedAttractions;
          await homestay.save();
          
          results.updated++;
          console.log(`Updated attractions for homestay: ${homestay.homestayId}`);
        }
      } else {
        results.unchanged++;
      }
    }
    
    console.log(`Migration complete. Updated ${results.updated} homestays.`);
    
    return NextResponse.json({
      success: true,
      message: `Migration complete. Updated ${results.updated} out of ${results.totalHomestays} homestays.`,
      results
    });
    
  } catch (error) {
    console.error('Error during attraction migration:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
} 