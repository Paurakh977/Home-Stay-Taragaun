from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Any, Union, Literal
from datetime import datetime
from enum import Enum
import re

class BilingualData(BaseModel):
    en: str
    ne: str

class LocalAttractionCategories:
    """Complete list of available local attractions matching the registration form"""
    NATURAL = [
        "National Parks & Conservation Areas/राष्ट्रिय निकुञ्ज तथा संरक्षित क्षेत्र",
        "Major Rivers & Lakes/प्रमुख नदी तथा तालहरू",
        "Ponds/पोखरी",
        "Viewpoint Tower/दृश्यावलोकन स्थल (भ्यू टावर)",
        "Watchtowers, wetlands, and grasslands/मचान तथा सिमसार क्षेत्र, घासे मैदान",
    ]
    
    CULTURAL = [
        "Museums & Cultural Centers/आदिवासी संग्रहालय तथा संस्कृति केन्द्रहरू",
        "Traditional Festivals, Dances & Rituals/परम्परागत पर्व, नाच तथा विधिहरू",
        "Local Community Lifestyle & Architecture/स्थानीय जीवनशैली तथा वास्तुकला",
    ]
    
    PRODUCTS = [
        "Organic Food/Organic खाना",
        "Traditional Dishes & Recipes/परम्परागत परिकारहरू",
    ]
    
    FOREST = [
        "Community-managed Forests/सामुदायिक वन क्षेत्रहरू",
        "Nature Walks & Eco Trails/प्रकृति पदमार्ग तथा पदयात्रा",
    ]
    
    WILDLIFE = [
        "Iconic & Endangered Wildlife/प्रमुख तथा लोपोन्मुख जनावरहरू",
        "Birdwatching Hotspots/चराचुरुङ्गी हेर्ने स्थानहरू",
        "Community-led Wildlife Conservation/सामुदायिक वन्यजन्तु संरक्षण प्रयासहरू",
        "Other endangered wildlife and birds/अन्य लोपोन्मुख वन्यजन्तु तथा चराचुरुङ्गी",
    ]
    
    ADVENTURE = [
        "Trekking, Climbing & Hiking Routes/ट्रेकिङ, आरोहण तथा हाइकिङ मार्गहरू",
        "Eco-tourism based exploration/Eco-tourism based exploration",
        "Adventure Sports like: Boating, Hiking, Jungle Walk, Elephant Safari, Jeep Safari/साहसिक खेलहरू (जस्तै: बोटिङ, हाइकिङ, जंगल वाक, हात्ती सफारी, जीप सफारी)",
        "Fishing in the fish pond/माछा पोखरीमा फिसिङ",
        "Jungle Walks & Wildlife Safaris/जंगल पदयात्रा तथा सफारी",
        "Sunset/Sunrise Viewing Points/सूर्यास्त/सूर्योदय हेर्ने स्थानहरू",
        "Cultural Village Tours, Cycling & Local Mobility/गाउँ सयर, साइकल यात्रा, स्थानीय सवारी अनुभव",
    ]

class EnhancedFeatureSearchHelper:
    """Enhanced helper class for comprehensive natural language query processing"""
    
    # Comprehensive keyword mappings with synonyms and variations
    ATTRACTION_KEYWORDS = {
    # Use exact database values for better matching
        'hiking': ['Trekking, Climbing & Hiking Routes/ट्रेकिङ, आरोहण तथा हाइकिङ मार्गहरू'],
        'trekking': ['Trekking, Climbing & Hiking Routes/ट्रेकिङ, आरोहण तथा हाइकिङ मार्गहरू'],
        'trek': ['Trekking, Climbing & Hiking Routes/ट्रेकिङ, आरोहण तथा हाइकिङ मार्गहरू'],
        'treking': ['Trekking, Climbing & Hiking Routes/ट्रेकिङ, आरोहण तथा हाइकिङ मार्गहरू'],
        'climbing': ['Trekking, Climbing & Hiking Routes/ट्रेकिङ, आरोहण तथा हाइकिङ मार्गहरू'],
        'fishing': ['Fishing in the fish pond/माछा पोखरीमा फिसिङ'],
        'fshing': ['Fishing in the fish pond/माछा पोखरीमा फिसिङ'],
        'fish pond': ['Fishing in the fish pond/माछा पोखरीमा फिसिङ'],
        'museum': ['Museums & Cultural Centers/आदिवासी संग्रहालय तथा संस्कृति केन्द्रहरू'],
        'cultural centers': ['Museums & Cultural Centers/आदिवासी संग्रहालय तथा संस्कृति केन्द्रहरू'],
        'cultural center': ['Museums & Cultural Centers/आदिवासी संग्रहालय तथा संस्कृति केन्द्रहरू'],
        'local dishes': ['Traditional Dishes & Recipes/परम्परागत परिकारहरू'],
        'local diseshad': ['Traditional Dishes & Recipes/परम्परागत परिकारहरू'],
        'traditional dishes': ['Traditional Dishes & Recipes/परम्परागत परिकारहरू'],
        'organic food': ['Organic Food/Organic खाना'],
        'organic': ['Organic Food/Organic खाना'],
        'national park': ['National Parks & Conservation Areas/राष्ट्रिय निकुञ्ज तथा संरक्षित क्षेत्र'],
        'natinal park': ['National Parks & Conservation Areas/राष्ट्रिय निकुञ्ज तथा संरक्षित क्षेत्र'],
        'conservation': ['National Parks & Conservation Areas/राष्ट्रिय निकुञ्ज तथा संरक्षित क्षेत्र'],
        'river': ['Major Rivers & Lakes/प्रमुख नदी तथा तालहरू'],
        'lake': ['Major Rivers & Lakes/प्रमुख नदी तथा तालहरू'],
        'viewpoint': ['Viewpoint Tower/दृश्यावलोकन स्थल (भ्यू टावर)'],
        'view tower': ['Viewpoint Tower/दृश्यावलोकन स्थल (भ्यू टावर)'],
        'bird watching': ['Birdwatching Hotspots/चराचुरुङ्गी हेर्ने स्थानहरू'],
        'bird wathign spot': ['Birdwatching Hotspots/चराचुरुङ्गी हेर्ने स्थानहरू'],
        'bird watching spot': ['Birdwatching Hotspots/चराचुरुङ्गी हेर्ने स्थानहरू'],
        'birdwatching': ['Birdwatching Hotspots/चराचुरुङ्गी हेर्ने स्थानहरू'],
        'wildlife': ['Iconic & Endangered Wildlife/प्रमुख तथा लोपोन्मुख जनावरहरू'],
        'endangered': ['Other endangered wildlife and birds/अन्य लोपोन्मुख वन्यजन्तु तथा चराचुरुङ्गी'],
        'boating': ['Adventure Sports like: Boating, Hiking, Jungle Walk, Elephant Safari, Jeep Safari/साहसिक खेलहरू (जस्तै: बोटिङ, हाइकिङ, जंगल वाक, हात्ती सफारी, जीप सफारी)'],
        'safari': ['Adventure Sports like: Boating, Hiking, Jungle Walk, Elephant Safari, Jeep Safari/साहसिक खेलहरू (जस्तै: बोटिङ, हाइकिङ, जंगल वाक, हात्ती सफारी, जीप सफारी)'],
        'jungle walk': ['Adventure Sports like: Boating, Hiking, Jungle Walk, Elephant Safari, Jeep Safari/साहसिक खेलहरू (जस्तै: बोटिङ, हाइकिङ, जंगल वाक, हात्ती सफारी, जीप सफारी)'],
        'adventure sports': ['Adventure Sports like: Boating, Hiking, Jungle Walk, Elephant Safari, Jeep Safari/साहसिक खेलहरू (जस्तै: बोटिङ, हाइकिङ, जंगल वाक, हात्ती सफारी, जीप सफारी)'],
    }

    INFRASTRUCTURE_KEYWORDS = {
        'water': ['Drinking Water and Solar Lighting/खानेपानी तथा सोलार बत्ती'],
        'drinking water': ['Drinking Water and Solar Lighting/खानेपानी तथा सोलार बत्ती'],
        'clean water': ['Drinking Water and Solar Lighting/खानेपानी तथा सोलार बत्ती'],
        'clean drinking water': ['Drinking Water and Solar Lighting/खानेपानी तथा सोलार बत्ती'],
        'toilet': ['Guest Room, Toilet, Bathroom/पाहुना कोठा, शौचालय, स्नानघर'],
        'bathroom': ['Guest Room, Toilet, Bathroom/पाहुना कोठा, शौचालय, स्नानघर'],
        'washroom': ['Guest Room, Toilet, Bathroom/पाहुना कोठा, शौचालय, स्नानघर'],
        'solar': ['Drinking Water and Solar Lighting/खानेपानी तथा सोलार बत्ती'],
        'solar lighting': ['Drinking Water and Solar Lighting/खानेपानी तथा सोलार बत्ती'],
        'lighting': ['Drinking Water and Solar Lighting/खानेपानी तथा सोलार बत्ती'],
        'communication': ['Communication Facility (Mobile)/सञ्चार सुविधा (मोबाइल)'],
        'mobile': ['Communication Facility (Mobile)/सञ्चार सुविधा (मोबाइल)'],
        'wifi': ['Communication Facility (Mobile)/सञ्चार सुविधा (मोबाइल)'],
        'internet': ['Communication Facility (Mobile)/सञ्चार सुविधा (मोबाइल)'],
        'guest room': ['Guest Room, Toilet, Bathroom/पाहुना कोठा, शौचालय, स्नानघर'],
        'room': ['Guest Room, Toilet, Bathroom/पाहुना कोठा, शौचालय, स्नानघर'],
        'community building': ['Community Building/सामुदायिक भवन'],
        'security': ['Security Post (Nepaltar)/सुरक्षा चौकी (नेपालटार)'],
        'health': ['Health Post (Udayapurgadhi)/स्वास्थ्य चौकी (उदयपुरगढी)'],
        'health post': ['Health Post (Udayapurgadhi)/स्वास्थ्य चौकी (उदयपुरगढी)'],
        'transport': ['Transportation Facility/यातायात सुविधा'],
        'transportation': ['Transportation Facility/यातायात सुविधा'],
    }

    TOURISM_KEYWORDS = {
        # Match exact frontend strings from HomestayFeaturesForm.tsx
        'welcome': ['Welcome and Farewell/स्वागत तथा विदाई'],
        'farewell': ['Welcome and Farewell/स्वागत तथा विदाई'],
        'accommodation': ['Comfortable Accommodation/आरामदायी आवास'],
        'comfortable accommodation': ['Comfortable Accommodation/आरामदायी आवास'],
        'gift': ['Gift or Souvenir/मायाको चिनो (उपहार)'],
        'souvenir': ['Gift or Souvenir/मायाको चिनो (उपहार)'],
        'cultural program': ['Traditional Cultural Program/परम्परागत सांस्कृतिक कार्यक्रम'],
        'traditional program': ['Traditional Cultural Program/परम्परागत सांस्कृतिक कार्यक्रम'],
        # FIXED: Use exact frontend string for local dishes
        'local dishes': ['Local Dishes/स्थानीय परिकारहरू'],
        'local dish': ['Local Dishes/स्थानीय परिकारहरू'],
        'local diseshad': ['Local Dishes/स्थानीय परिकारहरू'],  # Common misspelling
        'local food': ['Local Dishes/स्थानीय परिकारहरू'],
        'traditional dishes': ['Local Dishes/स्थानीय परिकारहरू'],  # Map to same value
        'traditional cuisine': ['Local Dishes/स्थानीय परिकारहरू'],  # NEW: Map traditional cuisine
        'cuisine': ['Local Dishes/स्थानीय परिकारहरू'],  # NEW: Map simple cuisine
    }
    
    @classmethod
    def enhanced_natural_query_processing(cls, query: str) -> Dict[str, Any]:
        """🔧 ENHANCED natural language processing to accurately handle must-have vs optional features"""
        import re
        query_lower = query.lower().strip()
        filters = {}
    
        # Initialize feature sets
        must_attractions = set()
        must_infrastructure = set()
        must_tourism_services = set()
        optional_attractions = set()
        optional_infrastructure = set()
        optional_tourism_services = set()
    
        # 🔧 STEP 1: Handle parentheses-based structured queries like "with (A, B, C) and if possible (X, Y)"
        parentheses_pattern = r'\(([^)]+)\).*?(?:and if possible|optionally|if available).*?\(([^)]+)\)'
        paren_match = re.search(parentheses_pattern, query_lower)
        
        if paren_match:
            must_text = paren_match.group(1)
            optional_text = paren_match.group(2)
            
            # Process must-have features from first parentheses
            cls._extract_features_from_text(must_text, must_attractions, must_infrastructure, must_tourism_services)
            # Process optional features from second parentheses
            cls._extract_features_from_text(optional_text, optional_attractions, optional_infrastructure, optional_tourism_services)
        
        else:
            # 🔧 STEP 2: Handle comma-separated lists with optional indicators
            # Pattern: "need A, B, C and if possible X, Y" or "with A, B and optionally X"
            optional_split = re.split(r'\b(?:and if possible|optionally|if available|would be nice|prefer|bonus)\b', query_lower, 1)
            
            if len(optional_split) > 1:
                must_text = optional_split[0].strip()
                optional_text = optional_split[1].strip()
                
                # Clean up common prefixes from must_text
                must_text = re.sub(r'^(?:i need|need|want|looking for|homestay with|homestay having|with|having)\s*', '', must_text)
                
                # Process must-have features (before "and if possible")
                cls._extract_features_from_text(must_text, must_attractions, must_infrastructure, must_tourism_services)
                # Process optional features (after "and if possible")
                cls._extract_features_from_text(optional_text, optional_attractions, optional_infrastructure, optional_tourism_services)
            
            else:
                # 🔧 STEP 3: No explicit optional indicators - analyze context
                full_text = query_lower
                
                # Check for OR patterns that indicate all features are optional
                if any(pattern in full_text for pattern in [' or ', ' any of ', ' either ', ' one of ']):
                    # Treat all as optional (OR logic)
                    cls._extract_features_from_text(full_text, optional_attractions, optional_infrastructure, optional_tourism_services)
                    filters['logical_operator'] = 'OR'
                else:
                    # 🔧 ENHANCED LOGIC: Check for mixed feature types
                    has_mixed_types = cls._contains_mixed_feature_types(full_text)
                    
                    if has_mixed_types:
                        # For mixed feature types, use more permissive logic
                        cls._extract_features_from_text(full_text, optional_attractions, optional_infrastructure, optional_tourism_services)
                        filters['logical_operator'] = 'OR'
                    else:
                        # Single feature type - treat as must-have
                        cls._extract_features_from_text(full_text, must_attractions, must_infrastructure, must_tourism_services)
                        filters['logical_operator'] = 'AND'

        # 🔧 SET FILTER PARAMETERS
        if must_attractions:
            filters['local_attractions'] = list(must_attractions)
        if optional_attractions:
            filters['any_local_attractions'] = list(optional_attractions)
        if must_infrastructure:
            filters['infrastructure'] = list(must_infrastructure)
        if optional_infrastructure:
            filters['any_infrastructure'] = list(optional_infrastructure)
        if must_tourism_services:
            filters['tourism_services'] = list(must_tourism_services)
        if optional_tourism_services:
            filters['any_tourism_services'] = list(optional_tourism_services)

        # 🔧 ENHANCED LOGICAL OPERATOR SETTING
        has_must_features = bool(must_attractions or must_infrastructure or must_tourism_services)
        has_optional_features = bool(optional_attractions or optional_infrastructure or optional_tourism_services)
        
        if has_must_features and has_optional_features:
            filters['logical_operator'] = 'MIXED'  # Both must-have AND optional features
        elif has_optional_features:
            filters['logical_operator'] = 'OR'  # Only optional features
        elif has_must_features:
            # Check if mixed feature types - if so, be more permissive
            feature_types = 0
            if must_attractions:
                feature_types += 1
            if must_infrastructure:
                feature_types += 1  
            if must_tourism_services:
                feature_types += 1
            
            if feature_types > 1:
                filters['logical_operator'] = 'OR'  # Mixed must-have features - use OR for better results
            else:
                filters['logical_operator'] = 'AND'  # Single category must-have features
        else:
            filters['logical_operator'] = 'AND'  # Default

        # 🔧 LOCATION EXTRACTION - Extract province, district, municipality from query
        # Common location patterns
        location_patterns = {
            'province': [
                r'(?:in|from|under)\s+([A-Za-z\s]+?)\s+province',
                r'([A-Za-z\s]+?)\s+pradesh',
                r'([A-Za-z\s]+?)\s+प्रदेश',
            ],
            'district': [
                r'(?:in|from|under)\s+([A-Za-z\s]+?)\s+district',
                r'([A-Za-z\s]+?)\s+जिल्ला',
            ],
            'municipality': [
                r'(?:in|from|under)\s+([A-Za-z\s]+?)\s+municipality',
                r'([A-Za-z\s]+?)\s+नगरपालिका',
                r'([A-Za-z\s]+?)\s+गाउँपालिका',
            ],
            'city': [
                r'(?:in|from|near)\s+([A-Za-z\s]+?)\s+city',
                r'([A-Za-z\s]+?)\s+शहर',
            ],
            'village': [
                r'(?:in|from|near)\s+([A-Za-z\s]+?)\s+village',
                r'([A-Za-z\s]+?)\s+गाउँ',
            ]
        }
        
        for location_type, patterns in location_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, query_lower, re.IGNORECASE)
                if match:
                    location_value = match.group(1).strip()
                    if location_value and len(location_value) > 1:
                        if location_type == 'village':
                            filters['village_name'] = location_value
                        else:
                            filters[location_type] = location_value
                        break

        # Enhanced pattern matching for ratings
        rating_patterns = [
            r'rating (?:over|above|more than|greater than) (\d+(?:\.\d+)?)',
            r'rating (\d+(?:\.\d+)?)\+',
            r'(\d+(?:\.\d+)?) star',
            r'minimum rating (\d+(?:\.\d+)?)',
        ]
        
        for pattern in rating_patterns:
            match = re.search(pattern, query_lower)
            if match:
                filters['min_average_rating'] = float(match.group(1))
                break

        # 🔧 HOMESTAY TYPE EXTRACTION - detect 'private' vs 'community' from NL query
        type_patterns = {
            'private': [
                r'\bprivate\s+home\s*stay(s)?\b',
                r'\bprivate\s+homestay(s)?\b',
                r'\bprivate\s+stay(s)?\b',
                r'\bonly\s+private\b',
                r'\bjust\s+private\b',
            ],
            'community': [
                r'\bcommunity(?:-based|-managed)?\s+home\s*stay(s)?\b',
                r'\bcommunity(?:-based|-managed)?\s+homestay(s)?\b',
                r'\bcommunity\s+stay(s)?\b',
                r'\bpublic\s+homestay(s)?\b',
                r'\bcommunity\s+(?:ones|options)\b',
            ],
        }
        matched_types = set()
        for t, pats in type_patterns.items():
            for pat in pats:
                if re.search(pat, query_lower):
                    matched_types.add(t)
                    break
        if len(matched_types) == 1:
            filters['homestay_type'] = next(iter(matched_types))

        return filters
    
    @classmethod
    def _contains_mixed_feature_types(cls, text: str) -> bool:
        """Check if query contains features from multiple categories (attractions + infrastructure/tourism)"""
        attraction_count = 0
        infrastructure_count = 0
        tourism_count = 0
        
        # Count how many different feature types are mentioned
        for keyword in cls.ATTRACTION_KEYWORDS:
            if keyword in text:
                attraction_count += 1
                
        for keyword in cls.INFRASTRUCTURE_KEYWORDS:
            if keyword in text:
                infrastructure_count += 1
                
        for keyword in cls.TOURISM_KEYWORDS:
            if keyword in text:
                tourism_count += 1
        
        # If we have attractions AND (infrastructure OR tourism), it's mixed
        return attraction_count > 0 and (infrastructure_count > 0 or tourism_count > 0)
    
    @classmethod
    def _extract_features_from_text(cls, text: str, attractions_set: set, infrastructure_set: set, tourism_set: set):
        """Helper method to extract features from text and add them to appropriate sets"""
        if not text or not text.strip():
            return
            
        # Clean the text and split by common separators
        text = text.strip()
        # Split by commas, 'and', 'with', but be careful not to split bilingual terms
        parts = re.split(r'(?:,\s*|\s+and\s+|\s+with\s+)(?![^/]*\s)', text)
        
        # Also try to match the full text as a single unit for better context
        all_parts = parts + [text]
        
        for part in all_parts:
            part = part.strip()
            if not part:
                continue
            for keyword, attraction_terms in cls.ATTRACTION_KEYWORDS.items():
                if keyword in part:
                    attractions_set.update(attraction_terms)
            for keyword, infra_terms in cls.INFRASTRUCTURE_KEYWORDS.items():
                if keyword in part:
                    infrastructure_set.update(infra_terms)
            for keyword, tourism_terms in cls.TOURISM_KEYWORDS.items():
                if keyword in part:
                    tourism_set.update(tourism_terms)

    @classmethod
    def map_simple_keywords_to_database_values(cls, keywords: List[str], category: str) -> List[str]:
        """🔧 NEW: Map simple keywords to exact database values for direct API calls"""
        if not keywords:
            return []
        
        mapped_values = set()
        
        # Choose the appropriate keyword mapping based on category
        if category == 'attractions':
            keyword_map = cls.ATTRACTION_KEYWORDS
        elif category == 'infrastructure':
            keyword_map = cls.INFRASTRUCTURE_KEYWORDS
        elif category == 'tourism':
            keyword_map = cls.TOURISM_KEYWORDS
        else:
            return keywords  # Return as-is if unknown category
        
        for keyword in keywords:
            if not keyword or not isinstance(keyword, str):
                continue
                
            keyword_lower = keyword.lower().strip()
            found_match = False
            
            # Try exact match first
            for map_key, db_values in keyword_map.items():
                if keyword_lower == map_key.lower():
                    mapped_values.update(db_values)
                    found_match = True
                    break
            
            # If no exact match, try partial match
            if not found_match:
                for map_key, db_values in keyword_map.items():
                    if keyword_lower in map_key.lower() or map_key.lower() in keyword_lower:
                        mapped_values.update(db_values)
                        found_match = True
                        break
            
            # If still no match, keep original keyword
            if not found_match:
                mapped_values.add(keyword)
        
        return list(mapped_values)

    @classmethod
    def fuzzy_keyword_match(cls, query: str, keywords: Dict[str, List[str]]) -> List[str]:
        """Fuzzy matching for keywords (e.g., 'hike' matches 'hiking')"""
        import difflib
        
        query_words = query.lower().split()
        matched_features = set()
        
        for word in query_words:
            for keyword, features in keywords.items():
                # Exact match
                if word in keyword or keyword in word:
                    matched_features.update(features)
                # Fuzzy match
                elif difflib.SequenceMatcher(None, word, keyword).ratio() > 0.8:
                    matched_features.update(features)
        
        return list(matched_features)

class HomestayFilterRequest(BaseModel):
    """Comprehensive homestay filtering request model"""
    
    # Natural language processing
    natural_language_query: Optional[str] = None
    
    # Location filters (bilingual support)
    province: Optional[str] = None
    district: Optional[str] = None
    municipality: Optional[str] = None
    ward: Optional[str] = None
    city: Optional[str] = None
    village_name: Optional[str] = None
    language: Optional[str] = "en"  # "en" or "ne" for bilingual fields
    
    # Basic homestay information
    homestay_name: Optional[str] = None
    homestay_type: Optional[Literal["community", "private"]] = None
    status: Optional[Literal["pending", "approved", "rejected"]] = None
    admin_username: Optional[str] = None
    
    # Capacity filters
    min_home_count: Optional[int] = None
    max_home_count: Optional[int] = None
    min_room_count: Optional[int] = None
    max_room_count: Optional[int] = None
    min_bed_count: Optional[int] = None
    max_bed_count: Optional[int] = None
    min_max_guests: Optional[int] = None
    max_max_guests: Optional[int] = None
    
    # Rating filters
    min_rating: Optional[float] = None
    max_rating: Optional[float] = None
    min_average_rating: Optional[float] = None
    max_average_rating: Optional[float] = None
    min_review_count: Optional[int] = None
    
    # Price filters
    min_price_per_night: Optional[float] = None
    max_price_per_night: Optional[float] = None
    
    # Feature filters
    amenities: Optional[List[str]] = None  # All must match
    any_amenities: Optional[List[str]] = None  # Any can match
    local_attractions: Optional[List[str]] = None  # All must match
    any_local_attractions: Optional[List[str]] = None  # Any can match
    tourism_services: Optional[List[str]] = None  # All must match
    any_tourism_services: Optional[List[str]] = None  # Any can match
    infrastructure: Optional[List[str]] = None  # All must match
    any_infrastructure: Optional[List[str]] = None  # Any can match
    
    # Feature access filters
    feature_access: Optional[Dict[str, bool]] = None
    
    # Boolean filters
    is_verified: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_admin: Optional[bool] = None
    
    # Registration filters
    dhsr_no: Optional[str] = None
    registration_authority: Optional[str] = None
    business_registration_number: Optional[str] = None
    
    # Date filters
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    updated_after: Optional[datetime] = None
    updated_before: Optional[datetime] = None
    
    # Contact filters
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    
    # Team member filters
    min_team_members: Optional[int] = None
    max_team_members: Optional[int] = None
    
    # Operator and management filters
    operator_gender: Optional[Literal["male", "female", "other"]] = None
    is_committee_driven: Optional[bool] = None
    availability_status: Optional[Literal["available", "unavailable", "partially_available"]] = None
    
    # Custom field filters
    custom_fields: Optional[Dict[str, Any]] = None
    
    # Text search
    search_query: Optional[str] = None
    
    # Pagination and sorting
    skip: Optional[int] = 0
    limit: Optional[int] = 100
    sort_by: Optional[str] = None
    sort_order: Optional[Literal["asc", "desc"]] = "desc"
    logical_operator: Optional[Literal["AND", "OR", "MIXED"]] = "AND"

class HomestayFilterResponse(BaseModel):
    """Enhanced response with additional metadata"""
    homestay_usernames: List[str] = Field(alias="homestayUsernames")
    homestay_names: List[str] = Field(alias="homestayNames")
    total_count: int = Field(alias="totalCount")
    filtered_count: int = Field(alias="filteredCount")
    applied_filters: Dict[str, Any] = Field(alias="appliedFilters")
    suggestions: Optional[List[str]] = None  # Suggestions for better filtering
    
    class Config:
        allow_population_by_field_name = True
