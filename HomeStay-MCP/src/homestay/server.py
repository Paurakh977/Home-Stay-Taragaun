from mcp.server.fastmcp import FastMCP
from .tools import enhanced_filter_homestays, get_homestay_stats
from .models import HomestayFilterRequest, HomestayFilterResponse
from .database import db_instance
from typing import Dict, Any
import os
import builtins
from contextlib import asynccontextmanager
from .models import EnhancedFeatureSearchHelper

# Create lifespan manager for database connection
@asynccontextmanager
async def lifespan_manager(server: FastMCP):
    """Manage database connection lifecycle"""
    try:
        # Connect to database on startup
        await db_instance.connect()
        print("Connected to MongoDB for homestay filtering")
        yield
    finally:
        # Disconnect on shutdown
        await db_instance.disconnect()
        print("Disconnected from MongoDB")

# Create FastMCP server with lifespan management
mcp = FastMCP(
    name="Homestay_Filter_Server", 
    stateless_http=True,
    lifespan=lifespan_manager
)

@mcp.tool(name="search_homestays")
async def search_homestays_tool(
    # Location filters
    province: str = None,
    district: str = None,
    municipality: str = None,
    status: str = None,
    
    # Feature filters - Local Attractions
    any_local_attractions: list = None,
    local_attractions: list = None,
    
    # Feature filters - Infrastructure  
    any_infrastructure: list = None,
    infrastructure: list = None,
    
    # Feature filters - Tourism Services
    any_tourism_services: list = None,
    tourism_services: list = None,
    
    # Other filters
    min_average_rating: float = None,
    skip: int = 0,
    limit: int = 100,
    sort_order: str = "desc",
    natural_language_description: str = None,
    logical_operator: str = "AND",
    # Homestay type (accept both aliases)
    type: str = None,
    homestay_type: str = None,
) -> HomestayFilterResponse:
    """🔧 ENHANCED tool with intelligent keyword mapping and improved logical operator handling"""
    
    # Process natural language FIRST
    extracted_filters = {}
    if natural_language_description:
        extracted_filters = EnhancedFeatureSearchHelper.enhanced_natural_query_processing(
            natural_language_description
        )
        print(f"🔍 DEBUGGING - Extracted NL filters: {extracted_filters}")

    # Override logical_operator if detected in the natural language query
    final_logical_operator = extracted_filters.get('logical_operator', logical_operator)

    # 🔧 CRITICAL PARAMETER VALIDATION - Sanitize inputs FIRST
    print(f"🔍 RAW PARAMETERS - any_local_attractions: {any_local_attractions} (type: {builtins.type(any_local_attractions)})")
    if type is not None:
        print(f"🔍 RAW PARAMETERS - type: {type} (type: {builtins.type(type)})")
    if homestay_type is not None:
        print(f"🔍 RAW PARAMETERS - homestay_type: {homestay_type} (type: {builtins.type(homestay_type)})")

    # Validate and sanitize list parameters to prevent type errors
    def sanitize_list(value):
        if value is None:
            return None
        if not isinstance(value, list):
            value = [value]
        return [str(item).strip() for item in value if item and str(item).strip()]

    any_local_attractions = sanitize_list(any_local_attractions)
    local_attractions = sanitize_list(local_attractions)
    any_infrastructure = sanitize_list(any_infrastructure)
    infrastructure = sanitize_list(infrastructure)
    any_tourism_services = sanitize_list(any_tourism_services)
    tourism_services = sanitize_list(tourism_services)

    # 🔧 ENHANCED: Map simple keywords to database values for direct API calls (non-NL)
    if not natural_language_description:
        print("🔧 MAPPING KEYWORDS FOR DIRECT API CALL")
        
        if any_local_attractions:
            mapped_attractions = EnhancedFeatureSearchHelper.map_simple_keywords_to_database_values(
                any_local_attractions, 'attractions'
            )
            any_local_attractions = mapped_attractions
            print(f"🔍 MAPPED any_local_attractions: {any_local_attractions}")
        
        if local_attractions:
            mapped_attractions = EnhancedFeatureSearchHelper.map_simple_keywords_to_database_values(
                local_attractions, 'attractions'
            )
            local_attractions = mapped_attractions
            print(f"🔍 MAPPED local_attractions: {local_attractions}")
        
        if any_infrastructure:
            mapped_infrastructure = EnhancedFeatureSearchHelper.map_simple_keywords_to_database_values(
                any_infrastructure, 'infrastructure'
            )
            any_infrastructure = mapped_infrastructure
            print(f"🔍 MAPPED any_infrastructure: {any_infrastructure}")
        
        if infrastructure:
            mapped_infrastructure = EnhancedFeatureSearchHelper.map_simple_keywords_to_database_values(
                infrastructure, 'infrastructure'
            )
            infrastructure = mapped_infrastructure
            print(f"🔍 MAPPED infrastructure: {infrastructure}")
        
        if any_tourism_services:
            mapped_services = EnhancedFeatureSearchHelper.map_simple_keywords_to_database_values(
                any_tourism_services, 'tourism'
            )
            any_tourism_services = mapped_services
            print(f"🔍 MAPPED any_tourism_services: {any_tourism_services}")
        
        if tourism_services:
            mapped_services = EnhancedFeatureSearchHelper.map_simple_keywords_to_database_values(
                tourism_services, 'tourism'
            )
            tourism_services = mapped_services
            print(f"🔍 MAPPED tourism_services: {tourism_services}")
        
        # 🔧 CRITICAL: INTELLIGENT LOGICAL OPERATOR SELECTION FOR DIRECT CALLS
        # This ensures consistency between natural language and direct API processing
        has_any_features = bool(any_local_attractions or any_infrastructure or any_tourism_services)
        has_must_features = bool(local_attractions or infrastructure or tourism_services)
        
        # Count feature categories to detect mixed types
        feature_categories = 0
        total_feature_count = 0
        if any_local_attractions or local_attractions:
            feature_categories += 1
            total_feature_count += len(any_local_attractions or []) + len(local_attractions or [])
        if any_infrastructure or infrastructure:
            feature_categories += 1
            total_feature_count += len(any_infrastructure or []) + len(infrastructure or [])
        if any_tourism_services or tourism_services:
            feature_categories += 1
            total_feature_count += len(any_tourism_services or []) + len(tourism_services or [])
        
        has_mixed_types = feature_categories > 1
        has_multiple_features = total_feature_count > 1
        
        print(f"🔧 DIRECT API ANALYSIS: categories={feature_categories}, mixed_types={has_mixed_types}, total_features={total_feature_count}")
        
        # 🔧 ENHANCED LOGIC: Auto-adjust logical operator to match natural language behavior
        if has_mixed_types:
            # Rule 1: Mixed feature types should use OR/MIXED for broader results
            if has_any_features and has_must_features:
                # Both any_ and must-have features with mixed types
                final_logical_operator = "MIXED"
                print(f"🔧 AUTO-SWITCHED TO MIXED: Mixed types with both any_ and must-have features")
            elif has_any_features:
                # Only any_ features with mixed types - always use OR
                final_logical_operator = "OR"
                print(f"🔧 AUTO-SWITCHED TO OR: Mixed any_ features across categories")
            elif has_must_features and total_feature_count > 2:
                # Multiple must-have features across categories - use MIXED for smart handling
                final_logical_operator = "MIXED"
                print(f"🔧 AUTO-SWITCHED TO MIXED: Multiple must-have features across categories")
            else:
                # Few must-have features across categories - use OR for better results
                final_logical_operator = "OR"
                print(f"🔧 AUTO-SWITCHED TO OR: Mixed types, using OR for broader results")
        
        elif has_multiple_features:
            # Rule 2: Multiple features in same category
            if has_any_features and not has_must_features:
                # Multiple any_ features in same category - use OR
                final_logical_operator = "OR"
                print(f"🔧 AUTO-SWITCHED TO OR: Multiple any_ features in same category")
            elif has_must_features and total_feature_count > 3:
                # Many must-have features - use OR for practical results
                final_logical_operator = "OR"
                print(f"🔧 AUTO-SWITCHED TO OR: Too many must-have features, using OR for practical results")
            # else: keep original logical_operator (likely AND)
        
        elif has_any_features:
            # Rule 3: Single category, any_ features - prefer OR
            final_logical_operator = "OR"
            print(f"🔧 AUTO-SWITCHED TO OR: Single category any_ features")
        
        # Rule 4: For single must-have feature, keep AND (default)
        print(f"🔧 FINAL LOGICAL OPERATOR FOR DIRECT API: {final_logical_operator}")

    # 🔧 ENHANCED CONSOLIDATION: Handle both must-have and optional features correctly
    # Only add NL filters if explicit parameters are empty
    if not any_local_attractions and not local_attractions:
        must_attractions_from_nl = extracted_filters.get('local_attractions') or []
        optional_attractions_from_nl = extracted_filters.get('any_local_attractions') or []
        if must_attractions_from_nl:
            # Convert must-have to optional for mixed types to get better results
            if extracted_filters.get('logical_operator') in ['OR', 'MIXED']:
                any_local_attractions = must_attractions_from_nl
                print(f"🔧 CONVERTED must-have attractions to optional for better results")
            else:
                local_attractions = must_attractions_from_nl
        elif optional_attractions_from_nl:
            any_local_attractions = optional_attractions_from_nl
    
    if not any_infrastructure and not infrastructure:
        must_infrastructure_from_nl = extracted_filters.get('infrastructure') or []
        optional_infrastructure_from_nl = extracted_filters.get('any_infrastructure') or []
        if must_infrastructure_from_nl:
            # Convert must-have to optional for mixed types to get better results
            if extracted_filters.get('logical_operator') in ['OR', 'MIXED']:
                any_infrastructure = must_infrastructure_from_nl
                print(f"🔧 CONVERTED must-have infrastructure to optional for better results")
            else:
                infrastructure = must_infrastructure_from_nl
        elif optional_infrastructure_from_nl:
            any_infrastructure = optional_infrastructure_from_nl

    # Tourism services via NL
    if not any_tourism_services and not tourism_services:
        must_services_from_nl = extracted_filters.get('tourism_services') or []
        optional_services_from_nl = extracted_filters.get('any_tourism_services') or []
        if must_services_from_nl:
            # Convert must-have to optional for mixed types to get better results
            if extracted_filters.get('logical_operator') in ['OR', 'MIXED']:
                any_tourism_services = must_services_from_nl
                print(f"🔧 CONVERTED must-have tourism services to optional for better results")
            else:
                tourism_services = must_services_from_nl
        elif optional_services_from_nl:
            any_tourism_services = optional_services_from_nl

    # Location and rating via NL, if supported
    if not province:
        province = extracted_filters.get('province')
    if not district:
        district = extracted_filters.get('district')
    if not municipality:
        municipality = extracted_filters.get('municipality')
    if not min_average_rating and extracted_filters.get('min_average_rating'):
        min_average_rating = extracted_filters.get('min_average_rating')

    # Homestay type via NL or explicit params.
    def _normalize_homestay_type(val: Any) -> Any:
        if val is None:
            return None
        v = str(val).strip().lower()
        # Map common synonyms
        synonym_map = {
            'public': 'community',
            'community-based': 'community',
            'community based': 'community',
            'community-managed': 'community',
            'community managed': 'community',
            'community': 'community',
            'private': 'private',
        }
        return synonym_map.get(v, v)

    detected_type = extracted_filters.get('homestay_type')
    explicit_type = _normalize_homestay_type(homestay_type) or _normalize_homestay_type(type)
    final_homestay_type = explicit_type or _normalize_homestay_type(detected_type)
    if final_homestay_type not in (None, 'community', 'private'):
        print(f"⚠️ WARNING - Invalid homestay type received: {final_homestay_type}, ignoring it")
        final_homestay_type = None

    print(f"🔍 SANITIZED PARAMETERS - any_local_attractions: {any_local_attractions}")
    print(f"🔍 SANITIZED PARAMETERS - local_attractions: {local_attractions}")
    print(f"🔍 SANITIZED PARAMETERS - any_infrastructure: {any_infrastructure}")
    print(f"🔍 SANITIZED PARAMETERS - infrastructure: {infrastructure}")
    print(f"🔍 SANITIZED PARAMETERS - any_tourism_services: {any_tourism_services}")
    print(f"🔍 SANITIZED PARAMETERS - tourism_services: {tourism_services}")
    if final_homestay_type:
        print(f"🔍 SANITIZED PARAMETERS - homestay_type: {final_homestay_type}")
    
    filter_request = HomestayFilterRequest(
        province=province,
        district=district,
        municipality=municipality,
        language="en",  # 🔧 EXPLICIT language setting
        status=status or "approved",  # Default to approved

        # Features
        any_local_attractions=any_local_attractions,
        local_attractions=local_attractions,
        any_infrastructure=any_infrastructure,
        infrastructure=infrastructure,
        any_tourism_services=any_tourism_services,
        tourism_services=tourism_services,

        # Basic homestay info
        homestay_type=final_homestay_type,

        # Other filters
        min_average_rating=min_average_rating,
        skip=skip,
        limit=limit,
        sort_order=sort_order,
        logical_operator=final_logical_operator
    )
    
    print(f"🔍 DEBUGGING - Final filter request: {filter_request.dict(exclude_none=True)}")
    
    return await enhanced_filter_homestays(filter_request)

@mcp.tool(name="get_homestay_statistics")
async def get_homestay_statistics_tool() -> Dict[str, Any]:
    """
    Get comprehensive statistics about homestays in the database.
    
    Returns detailed statistics including:
    - Total number of homestays
    - Count by status (approved, pending, rejected)
    - Count by type (community, private)
    - Count by verification status
    - Count of featured homestays
    - Average ratings, rooms, and beds
    - Distribution by provinces and districts
    
    This tool is useful for understanding the overall homestay landscape
    and getting insights into the database contents.
    
    Returns:
        Dictionary containing comprehensive homestay statistics
    """
    return await get_homestay_stats()

@mcp.tool(name="test_homestay_filtering")
async def test_homestay_filtering_tool() -> Dict[str, Any]:
    """
    Run a suite of tests to validate the homestay filtering logic.
    
    This tool executes several checks:
    1. Verifies the database connection and counts total documents.
    2. Fetches a sample document to inspect its structure.
    3. Tests exact matching for a full attraction string.
    4. Tests partial matching for English and Nepali keywords.
    5. Verifies the collection structure using the new helper function.

    Returns:
        A dictionary containing the results of each test.
    """
    from .tools import test_queries, verify_collection_structure
    
    print("--- Running Collection Structure Verification ---")
    await verify_collection_structure()
    
    print("\n--- Running Test Queries ---")
    await test_queries()
    
    return {"status": "completed", "message": "Tests executed. Check server logs for details."}