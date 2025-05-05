var map, resultMap;
        let marker;
        let currentLat = null;
        let currentLng = null;
        let savedLocation = null;
        let provider;
        let searchControl;
        let currentLayer, satelliteLayer, terrainLayer, streetLayer, mapboxLayer;
        let poiLayer, roadLabelsLayer;
        let loadNepalPOIs; // Declare this globally
        
        // Nepal center coordinates
        const NEPAL_CENTER = [28.3949, 84.1240];
        const INITIAL_ZOOM = 7;
        
        // Well-known Nepal locations for suggestions
        const nepalLocations = [
            { name: 'Kathmandu', lat: 27.7041, lng: 85.3230 },
            { name: 'Pokhara', lat: 28.2096, lng: 83.9856 },
            { name: 'Lalitpur', lat: 27.6588, lng: 85.3247 },
            { name: 'Bhaktapur', lat: 27.6710, lng: 85.4298 },
            { name: 'Chitwan National Park', lat: 27.5291, lng: 84.3542 },
            { name: 'Lumbini', lat: 27.4833, lng: 83.2667 },
            { name: 'Mount Everest Base Camp', lat: 28.0020, lng: 86.8598 },
            { name: 'Nagarkot', lat: 27.7289, lng: 85.5232 },
            { name: 'Annapurna Base Camp', lat: 28.5308, lng: 83.8777 },
            { name: 'Patan', lat: 27.6667, lng: 85.3333 },
            { name: 'Namche Bazaar', lat: 27.8069, lng: 86.7140 },
            { name: 'Boudhanath Stupa', lat: 27.7215, lng: 85.3620 },
            { name: 'Pashupatinath Temple', lat: 27.7105, lng: 85.3487 },
            { name: 'Thamel', lat: 27.7152, lng: 85.3123 }
        ];
        
        // Initialize the map when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            initializeMap();
            setupEventListeners();
            setupSearch();
            
            // Get location info for initial marker position
            getLocationInfo(NEPAL_CENTER[0], NEPAL_CENTER[1]);
        });
        
        function initializeMap() {
            // Create the main map centered on Nepal
            map = L.map('map', {
                zoomControl: true,
                attributionControl: true
            }).setView(NEPAL_CENTER, INITIAL_ZOOM);
            
            // Define map layers - using more reliable tile services
            streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            });
            
            // More reliable satellite layer
            satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                attribution: 'Imagery &copy; Google',
                maxZoom: 20
            });
            
            // More reliable terrain layer
            terrainLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
                attribution: 'Terrain &copy; Google',
                maxZoom: 20
            });
            
            // More reliable detailed map layer
            mapboxLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">HOT</a>',
                maxZoom: 19
            });
            
            // Process and display POIs on the map
            poiLayer = L.layerGroup().addTo(map);
            roadLabelsLayer = L.layerGroup().addTo(map);
            
            // Add CSS for POI markers and road labels
            const styleElement = document.createElement('style');
            styleElement.innerHTML = `
                .poi-marker {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                .poi-marker i {
                    font-size: 14px;
                }
                .road-label {
                    background: rgba(255, 255, 255, 0.8);
                    padding: 2px 4px;
                    border-radius: 2px;
                    font-size: 10px;
                    font-weight: bold;
                    color: #444;
                    white-space: nowrap;
                    text-align: center;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                    pointer-events: none;
                }
            `;
            document.head.appendChild(styleElement);
            
            function processPOIs(data) {
                // Clear existing POIs
                poiLayer.clearLayers();
                roadLabelsLayer.clearLayers();
                
                // Process each element
                data.elements.forEach(element => {
                    if (element.type === 'node' && element.tags) {
                        // Determine icon based on amenity type
                        let icon = 'place';
                        let color = '#1A73E8';
                        
                        if (element.tags.amenity === 'restaurant' || element.tags.amenity === 'cafe') {
                            icon = 'restaurant';
                            color = '#F44336';
                        } else if (element.tags.amenity === 'hospital' || element.tags.amenity === 'pharmacy') {
                            icon = 'local_hospital';
                            color = '#E91E63';
                        } else if (element.tags.amenity === 'school' || element.tags.amenity === 'college') {
                            icon = 'school';
                            color = '#4CAF50';
                        } else if (element.tags.amenity === 'bank' || element.tags.amenity === 'atm') {
                            icon = 'account_balance';
                            color = '#FF9800';
                        } else if (element.tags.shop) {
                            icon = 'shopping_cart';
                            color = '#9C27B0';
                        } else if (element.tags.tourism === 'hotel' || element.tags.tourism === 'guest_house') {
                            icon = 'hotel';
                            color = '#3F51B5';
                        } else if (element.tags.tourism === 'attraction') {
                            icon = 'attractions';
                            color = '#009688';
                        } else if (element.tags.amenity === 'fuel') {
                            icon = 'local_gas_station';
                            color = '#795548';
                        } else if (element.tags.amenity === 'police') {
                            icon = 'local_police';
                            color = '#607D8B';
                        }
                        
                        // Only add POI if it has a name (to reduce clutter)
                        if (element.tags.name) {
                            // Create custom HTML icon for POI
                            const poiIcon = L.divIcon({
                                html: `<div class="poi-marker"><i class="material-icons" style="color:${color}">${icon}</i></div>`,
                                className: '',
                                iconSize: [24, 24],
                                iconAnchor: [12, 12]
                            });
                            
                            // Create marker and popup
                            const name = element.tags.name;
                            const poiType = element.tags.amenity || element.tags.shop || element.tags.tourism || '';
                            
                            const marker = L.marker([element.lat, element.lon], {
                                icon: poiIcon
                            }).bindPopup(`
                                <div style="text-align:center">
                                    <div style="font-size:24px; color:${color}">
                                        <i class="material-icons">${icon}</i>
                                    </div>
                                    <div style="font-weight:bold; font-size:14px;">${name}</div>
                                    <div style="color:#5F6368; font-size:12px; text-transform:capitalize">
                                        ${poiType.replace('_', ' ')}
                                    </div>
                                </div>
                            `);
                            
                            // Add to layer
                            poiLayer.addLayer(marker);
                        }
                    } else if (element.type === 'way' && element.tags && element.tags.name && element.tags.highway) {
                        // Process roads with names
                        // We need to find the center point of the road to place the label
                        if (element.nodes && element.nodes.length > 0) {
                            // Find coordinates for nodes
                            const nodeCoords = [];
                            data.elements.forEach(el => {
                                if (el.type === 'node' && element.nodes.includes(el.id)) {
                                    nodeCoords.push([el.lat, el.lon]);
                                }
                            });
                            
                            // If we have coordinates, create a road line
                            if (nodeCoords.length > 1) {
                                // Find center of the road for the label
                                const midpointIndex = Math.floor(nodeCoords.length / 2);
                                const labelPoint = nodeCoords[midpointIndex];
                                
                                // Create road label
                                if (labelPoint) {
                                    const roadName = element.tags.name;
                                    
                                    // Create a custom road label
                                    const roadIcon = L.divIcon({
                                        html: `<div class="road-label">${roadName}</div>`,
                                        className: '',
                                        iconSize: [120, 20],
                                        iconAnchor: [60, 10]
                                    });
                                    
                                    const roadMarker = L.marker(labelPoint, {
                                        icon: roadIcon
                                    });
                                    
                                    roadLabelsLayer.addLayer(roadMarker);
                                }
                            }
                        }
                    }
                });
            }
            
            // Set initial layer
            currentLayer = streetLayer;
            currentLayer.addTo(map);
            
            // Create custom marker icon (pin shape)
            const markerHtml = `<div class="marker-pin"></div>`;
            const customIcon = L.divIcon({
                html: markerHtml,
                className: '',
                iconSize: [30, 42],
                iconAnchor: [15, 42]
            });
            
            // Add a marker that will be draggable
            marker = L.marker(NEPAL_CENTER, {
                draggable: true,
                icon: customIcon
            }).addTo(map);
            
            // Update coordinates when marker is dragged
            marker.on('dragend', function(event) {
                const latlng = marker.getLatLng();
                updateCoordinates(latlng.lat, latlng.lng);
                getLocationInfo(latlng.lat, latlng.lng);
            });
            
            // Set initial coordinates
            updateCoordinates(NEPAL_CENTER[0], NEPAL_CENTER[1]);
            
            // Add click event to map for updating marker position
            map.on('click', function(e) {
                marker.setLatLng(e.latlng);
                updateCoordinates(e.latlng.lat, e.latlng.lng);
                getLocationInfo(e.latlng.lat, e.latlng.lng);
            });
            
            // Initialize measurement control
            initMeasurementTool();
            
            // Define loadNepalPOIs function so it can be accessed globally
            loadNepalPOIs = function() {
                // Show loading indicator
                document.getElementById('loadingIndicator').style.display = 'block';
                
                // Only load POIs when zoomed in to avoid overwhelming the map
                if (map.getZoom() < 14) {
                    document.getElementById('loadingIndicator').style.display = 'none';
                    return;
                }
                
                // Get current map bounds
                const bounds = map.getBounds();
                const south = bounds.getSouth();
                const west = bounds.getWest();
                const north = bounds.getNorth();
                const east = bounds.getEast();
                
                // Construct Overpass API query for various POIs in Nepal
                // Limited to within Nepal to avoid loading too much data
                const query = `
                    [out:json][timeout:25];
                    (
                      node["amenity"~"restaurant|cafe|hospital|school|college|bank|atm|pharmacy|police|fuel"](${south},${west},${north},${east});
                      node["shop"~"supermarket|convenience|mall"](${south},${west},${north},${east});
                      node["tourism"~"hotel|guest_house|attraction"](${south},${west},${north},${east});
                      way["highway"~"primary|secondary|tertiary"]["name"](${south},${west},${north},${east});
                    );
                    out body;
                    >;
                    out skel qt;
                `;
                
                // Fetch data from Overpass API
                fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
                    .then(response => response.json())
                    .then(data => {
                        // Process the POIs
                        processPOIs(data);
                        document.getElementById('loadingIndicator').style.display = 'none';
                    })
                    .catch(error => {
                        console.error('Error fetching POIs:', error);
                        document.getElementById('loadingIndicator').style.display = 'none';
                    });
            };
            
            // Load POIs when map view changes
            map.on('moveend', function() {
                if (currentLayer === mapboxLayer || map.getZoom() >= 14) {
                    loadNepalPOIs();
                }
            });
        }
        
        function setupSearch() {
            // Create provider for search
            provider = new GeoSearch.OpenStreetMapProvider({
                params: {
                    countrycodes: 'np', // Limit to Nepal
                    viewbox: '80.0,26.3,88.2,30.5', // Bounding box for Nepal
                    bounded: 1
                }
            });
            
            // Connect the search input to suggestions
            const searchInput = document.getElementById('searchInput');
            const suggestionsContainer = document.getElementById('suggestions');
            
            // Handle input changes for showing suggestions
            searchInput.addEventListener('input', async function() {
                const query = searchInput.value.trim();
                
                if (query.length >= 2) {
                    // Show local suggestions first
                    showLocalSuggestions(query);
                    
                    // Then try to get online suggestions
                    try {
                        const results = await provider.search({ query: query + ' Nepal' });
                        if (results.length > 0) {
                            updateSuggestions(results);
                        }
                    } catch (error) {
                        console.log('Error fetching search results:', error);
                    }
                } else {
                    suggestionsContainer.style.display = 'none';
                }
            });
            
            // Handle search submission
            searchInput.addEventListener('keypress', async function(e) {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    
                    if (query.length > 0) {
                        try {
                            // Close suggestions
                            suggestionsContainer.style.display = 'none';
                            
                            // Search for the location
                            const results = await provider.search({ query: query + ' Nepal' });
                            
                            if (results.length > 0) {
                                const result = results[0];
                                const latlng = { lat: result.y, lng: result.x };
                                
                                // Update marker and view
                                marker.setLatLng(latlng);
                                map.setView(latlng, 16);
                                updateCoordinates(latlng.lat, latlng.lng);
                            } else {
                                alert('No results found for: ' + query);
                            }
                        } catch (error) {
                            console.log('Error performing search:', error);
                            alert('Error performing search. Please try again.');
                        }
                    }
                }
            });
            
            // Close suggestions when clicking elsewhere
            document.addEventListener('click', function(e) {
                if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                    suggestionsContainer.style.display = 'none';
                }
            });
        }
        
        function showLocalSuggestions(query) {
            const suggestionsContainer = document.getElementById('suggestions');
            suggestionsContainer.innerHTML = '';
            
            // Filter local suggestions based on query
            const matchedLocations = nepalLocations.filter(location => 
                location.name.toLowerCase().includes(query.toLowerCase())
            );
            
            if (matchedLocations.length > 0) {
                matchedLocations.forEach(location => {
                    const item = document.createElement('div');
                    item.className = 'suggestion-item';
                    
                    item.innerHTML = `
                        <i class="material-icons">place</i>
                        <div class="suggestion-text">${location.name}</div>
                    `;
                    
                    item.addEventListener('click', function() {
                        // Update the search input
                        document.getElementById('searchInput').value = location.name;
                        
                        // Update marker and map
                        const latlng = { lat: location.lat, lng: location.lng };
                        marker.setLatLng(latlng);
                        map.setView(latlng, 16);
                        updateCoordinates(latlng.lat, latlng.lng);
                        
                        // Hide suggestions
                        suggestionsContainer.style.display = 'none';
                    });
                    
                    suggestionsContainer.appendChild(item);
                });
                
                suggestionsContainer.style.display = 'block';
            } else {
                suggestionsContainer.style.display = 'none';
            }
        }
        
        function updateSuggestions(results) {
            const suggestionsContainer = document.getElementById('suggestions');
            
            // Add more suggestions from search results if they're not already in the list
            if (results.length > 0) {
                results.forEach(result => {
                    // Check if this suggestion is already in the container
                    const existingItems = suggestionsContainer.querySelectorAll('.suggestion-text');
                    let alreadyExists = false;
                    
                    existingItems.forEach(item => {
                        if (item.textContent === result.label) {
                            alreadyExists = true;
                        }
                    });
                    
                    if (!alreadyExists) {
                        const item = document.createElement('div');
                        item.className = 'suggestion-item';
                        item.innerHTML = `
                            <i class="material-icons">search</i>
                            <div class="suggestion-text">${result.label}</div>
                        `;
                        
                        item.addEventListener('click', function() {
                            // Update the search input
                            document.getElementById('searchInput').value = result.label;
                            
                            // Update marker and map
                            const latlng = { lat: result.y, lng: result.x };
                            marker.setLatLng(latlng);
                            map.setView(latlng, 16);
                            updateCoordinates(latlng.lat, latlng.lng);
                            
                            // Hide suggestions
                            suggestionsContainer.style.display = 'none';
                        });
                        
                        suggestionsContainer.appendChild(item);
                    }
                });
                
                suggestionsContainer.style.display = 'block';
            }
        }
        
        function updateCoordinates(lat, lng) {
            // Make sure we have numbers
            currentLat = parseFloat(lat);
            currentLng = parseFloat(lng);
            
            // Format coordinates to 6 decimal places if they are numbers
            if (!isNaN(currentLat) && !isNaN(currentLng)) {
                const formattedLat = currentLat.toFixed(6);
                const formattedLng = currentLng.toFixed(6);
                
                // Update the coordinates display
                document.getElementById('coordinates').textContent = 
                    `${formattedLat}, ${formattedLng}`;
            } else {
                document.getElementById('coordinates').textContent = 'Invalid coordinates';
            }
        }
        
        function getLocationInfo(lat, lng) {
            // Show loading indicator
            document.getElementById('address').textContent = 'Finding location...';
            document.getElementById('district').textContent = 'Finding district...';
            
            // Update Google Maps button to use current coordinates
            updateGoogleMapsButton(lat, lng);
            
            // Get address using reverse geocoding
            reverseGeocode(lat, lng);
            
            // Find district (can be implemented using GeoJSON district boundaries)
            findDistrict(lat, lng);
        }
        
        function updateGoogleMapsButton(lat, lng) {
            // Get the place name if available
            const placeName = document.getElementById('address').getAttribute('data-place-name') || '';
            
            // Update the main page Google Maps button
            document.getElementById('viewGoogleMaps').onclick = function() {
                let googleMapsUrl;
                
                // If we have a place name, use it for better Google Maps search
                if (placeName && placeName.trim() !== '') {
                    googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(placeName)}/@${lat.toFixed(6)},${lng.toFixed(6)},17z`;
                } else {
                    // Fall back to coordinates
                    googleMapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
                }
                
                window.open(googleMapsUrl, '_blank');
            };
        }
        
        function reverseGeocode(lat, lng) {
            // Show loading indicator
            document.getElementById('loadingIndicator').style.display = 'block';
            
            // Use Nominatim for reverse geocoding
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
            
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data && data.display_name) {
                        // Store the place name if available
                        const placeName = data.name || (data.address ? 
                            (data.address.amenity || data.address.building || 
                             data.address.tourism || data.address.shop || 
                             data.address.office || data.address.historic || '') : '');
                        
                        document.getElementById('address').textContent = data.display_name;
                        
                        // Store the place name as a data attribute for Google Maps integration
                        document.getElementById('address').setAttribute('data-place-name', placeName);
                        
                        // Also check if we can get POI information from nearby features
                        checkNearbyPOIs(lat, lng);
                    } else {
                        document.getElementById('address').textContent = 'Address not found';
                        document.getElementById('address').setAttribute('data-place-name', '');
                    }
                    document.getElementById('loadingIndicator').style.display = 'none';
                })
                .catch(error => {
                    console.error('Error:', error);
                    document.getElementById('address').textContent = 'Failed to get address';
                    document.getElementById('address').setAttribute('data-place-name', '');
                    document.getElementById('loadingIndicator').style.display = 'none';
                });
        }
        
        // Check for nearby POIs to provide better place information
        function checkNearbyPOIs(lat, lng) {
            const radius = 50; // 50 meters radius
            
            // Get nearby POIs from OpenStreetMap
            const query = `
                [out:json][timeout=10];
                (
                  node["name"](around:${radius},${lat},${lng});
                  way["name"](around:${radius},${lat},${lng});
                );
                out body;
            `;
            
            fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.elements && data.elements.length > 0) {
                        // Sort by distance to the point
                        const nearbyPlaces = data.elements
                            .filter(element => element.tags && element.tags.name)
                            .map(element => {
                                const distance = getDistance(
                                    lat, lng, 
                                    element.lat || element.center.lat, 
                                    element.lon || element.center.lon
                                );
                                return {
                                    name: element.tags.name,
                                    type: element.tags.amenity || element.tags.shop || element.tags.tourism || element.tags.building || '',
                                    distance: distance
                                };
                            })
                            .sort((a, b) => a.distance - b.distance);
                        
                        // If we found a nearby named place, update the place name
                        if (nearbyPlaces.length > 0) {
                            const nearestPlace = nearbyPlaces[0];
                            document.getElementById('address').setAttribute('data-place-name', nearestPlace.name);
                            
                            // If it's a very close POI (within 20m), update the address display
                            if (nearestPlace.distance < 0.02) { // Less than 20 meters
                                const currentAddress = document.getElementById('address').textContent;
                                const placeType = nearestPlace.type ? ` (${nearestPlace.type})` : '';
                                document.getElementById('address').textContent = `${nearestPlace.name}${placeType}, ${currentAddress}`;
                            }
                        }
                    }
                })
                .catch(error => {
                    console.error('Error finding nearby places:', error);
                });
        }
        
        function findDistrict(lat, lng) {
            // For simplicity, we'll just use a probabilistic approach 
            // to identify a district near the coordinates
            // In a real app, you'd use GeoJSON polygon data for precise boundaries
            
            // Find the closest district from our predefined Nepal locations
            let closestDistrict = "Unknown";
            let closestDistance = Infinity;
            
            const districts = [
                { name: "Kathmandu", lat: 27.7041, lng: 85.3230 },
                { name: "Lalitpur", lat: 27.6588, lng: 85.3247 },
                { name: "Bhaktapur", lat: 27.6710, lng: 85.4298 },
                { name: "Kaski", lat: 28.2096, lng: 83.9856 },
                { name: "Chitwan", lat: 27.5291, lng: 84.3542 },
                { name: "Rupandehi", lat: 27.4833, lng: 83.2667 },
                { name: "Solukhumbu", lat: 27.7499, lng: 86.7218 },
                { name: "Mustang", lat: 28.9985, lng: 83.8473 },
                { name: "Manang", lat: 28.6667, lng: 84.0167 },
                { name: "Dolpa", lat: 29.0000, lng: 83.0000 },
                { name: "Jhapa", lat: 26.6799, lng: 87.8942 },
                { name: "Sunsari", lat: 26.6739, lng: 87.2823 },
                { name: "Morang", lat: 26.6799, lng: 87.4604 }
            ];
            
            districts.forEach(district => {
                const distance = getDistance(lat, lng, district.lat, district.lng);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestDistrict = district.name;
                }
            });
            
            document.getElementById('district').textContent = closestDistrict + " District";
        }
        
        function getDistance(lat1, lon1, lat2, lon2) {
            // Calculate distance between coordinates using Haversine formula
            const R = 6371; // Radius of the earth in km
            const dLat = deg2rad(lat2 - lat1);
            const dLon = deg2rad(lon2 - lon1);
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
                Math.sin(dLon/2) * Math.sin(dLon/2); 
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            const distance = R * c; // Distance in km
            return distance;
        }
        
        function deg2rad(deg) {
            return deg * (Math.PI/180);
        }
        
        function initMeasurementTool() {
            let measureControl = false;
            let measurePoints = [];
            let lineLayer = null;
            let markerLayers = [];
            let tooltips = [];
            
            document.getElementById('measureDistance').addEventListener('click', function() {
                if (!measureControl) {
                    // Enable measurement
                    measureControl = true;
                    this.style.backgroundColor = '#E8F0FE';
                    this.innerHTML = '<i class="material-icons">close</i> Cancel Measurement';
                    
                    // Add instruction tooltip
                    const tooltip = document.createElement('div');
                    tooltip.className = 'measure-tooltip';
                    tooltip.textContent = 'Click on the map to start measuring';
                    tooltip.style.top = '120px';
                    tooltip.style.right = '10px';
                    document.body.appendChild(tooltip);
                    tooltips.push(tooltip);
                    
                    // Change cursor
                    document.getElementById('map').style.cursor = 'crosshair';
                    
                    // Add click event for measurement
                    map.on('click', addMeasurePoint);
                } else {
                    // Disable measurement
                    clearMeasurement();
                }
            });
            
            function addMeasurePoint(e) {
                const latlng = e.latlng;
                measurePoints.push(latlng);
                
                // Add marker
                const markerHtml = `<div class="marker-pin" style="background-color: #FF4081;"></div>`;
                const icon = L.divIcon({
                    html: markerHtml,
                    className: '',
                    iconSize: [20, 28],
                    iconAnchor: [10, 28]
                });
                
                const marker = L.marker(latlng, { icon: icon }).addTo(map);
                markerLayers.push(marker);
                
                // Draw line if we have 2+ points
                if (measurePoints.length > 1) {
                    if (lineLayer) {
                        map.removeLayer(lineLayer);
                    }
                    
                    lineLayer = L.polyline(measurePoints, {
                        color: '#FF4081',
                        weight: 3,
                        opacity: 0.7,
                        dashArray: '5, 5'
                    }).addTo(map);
                    
                    // Calculate total distance
                    let totalDistance = 0;
                    for (let i = 1; i < measurePoints.length; i++) {
                        totalDistance += getDistance(
                            measurePoints[i-1].lat, measurePoints[i-1].lng,
                            measurePoints[i].lat, measurePoints[i].lng
                        );
                    }
                    
                    // Show distance
                    const distanceTooltip = document.createElement('div');
                    distanceTooltip.className = 'measure-tooltip';
                    distanceTooltip.textContent = `Total distance: ${totalDistance.toFixed(2)} km`;
                    distanceTooltip.style.top = '150px';
                    distanceTooltip.style.right = '10px';
                    document.body.appendChild(distanceTooltip);
                    
                    // Remove old tooltip if exists
                    if (tooltips.length > 1) {
                        document.body.removeChild(tooltips[1]);
                        tooltips.splice(1, 1);
                    }
                    tooltips.push(distanceTooltip);
                }
            }
            
            function clearMeasurement() {
                measureControl = false;
                document.getElementById('measureDistance').style.backgroundColor = 'white';
                document.getElementById('measureDistance').innerHTML = '<i class="material-icons">straighten</i> Measure Distance';
                
                // Clear measurements
                measurePoints = [];
                
                // Remove line
                if (lineLayer) {
                    map.removeLayer(lineLayer);
                    lineLayer = null;
                }
                
                // Remove markers
                markerLayers.forEach(marker => map.removeLayer(marker));
                markerLayers = [];
                
                // Remove tooltips
                tooltips.forEach(tooltip => document.body.removeChild(tooltip));
                tooltips = [];
                
                // Reset cursor
                document.getElementById('map').style.cursor = '';
                
                // Remove click event
                map.off('click', addMeasurePoint);
            }
        }
        
        function setupEventListeners() {
            // Map type selector
            document.getElementById('mapTypeSelect').addEventListener('change', function(e) {
                const mapType = e.target.value;
                
                // Remove current layer
                map.removeLayer(currentLayer);
                
                // Add selected layer
                switch(mapType) {
                    case 'satellite':
                        currentLayer = satelliteLayer;
                        poiLayer.clearLayers(); // Clear POIs on satellite view
                        break;
                    case 'terrain':
                        currentLayer = terrainLayer;
                        poiLayer.clearLayers(); // Clear POIs on terrain view
                        break;
                    case 'mapbox':
                        currentLayer = mapboxLayer;
                        loadNepalPOIs(); // Load POIs when selecting detailed map
                        break;
                    default:
                        currentLayer = streetLayer;
                        poiLayer.clearLayers(); // Clear POIs on default view
                }
                
                currentLayer.addTo(map);
                
                // If switching to Mapbox or zoom level is appropriate, load POIs
                if (mapType === 'mapbox' || map.getZoom() >= 14) {
                    loadNepalPOIs();
                }
            });
            
            // Save location button
            document.getElementById('saveLocation').addEventListener('click', function() {
                if (currentLat !== null && currentLng !== null) {
                    // Show loading indicator
                    document.getElementById('loadingIndicator').style.display = 'block';
                    
                    // Short delay to ensure we have the latest location info
                    setTimeout(function() {
                        saveLocation(currentLat, currentLng);
                        showPage2();
                        
                        // Hide loading indicator
                        document.getElementById('loadingIndicator').style.display = 'none';
                    }, 500);
                } else {
                    alert('Please select a location first');
                }
            });
            
            // Back button
            document.getElementById('backToSearch').addEventListener('click', function() {
                showPage1();
            });
            
            // Copy coordinates button
            document.getElementById('copyCoordinates').addEventListener('click', function() {
                if (savedLocation) {
                    const text = `${savedLocation.lat.toFixed(6)}, ${savedLocation.lng.toFixed(6)}`;
                    navigator.clipboard.writeText(text)
                        .then(() => {
                            alert('Coordinates copied to clipboard!');
                        })
                        .catch(err => {
                            console.error('Could not copy text: ', err);
                            // Fallback for browsers that don't support clipboard API
                            const textarea = document.createElement('textarea');
                            textarea.value = text;
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                            alert('Coordinates copied to clipboard!');
                        });
                }
            });
            
            // View on Google Maps button (result page)
            document.getElementById('viewGoogleMapsResult').addEventListener('click', function() {
                if (savedLocation) {
                    const googleMapsUrl = `https://www.google.com/maps?q=${savedLocation.lat.toFixed(6)},${savedLocation.lng.toFixed(6)}`;
                    window.open(googleMapsUrl, '_blank');
                }
            });
        }
        
        function saveLocation(lat, lng) {
            // Get the place name if available
            const placeName = document.getElementById('address').getAttribute('data-place-name') || '';
            
            // Save coordinates to variable
            savedLocation = {
                lat: lat,
                lng: lng,
                address: document.getElementById('address').textContent,
                district: document.getElementById('district').textContent,
                placeName: placeName
            };
            
            // Display the saved coordinates
            const formattedLat = lat.toFixed(6);
            const formattedLng = lng.toFixed(6);
            document.getElementById('savedCoordinates').textContent = 
                `${formattedLat}, ${formattedLng}`;
                
            // Display address and district
            document.getElementById('savedAddress').textContent = savedLocation.address;
            document.getElementById('savedDistrict').textContent = savedLocation.district;
            
            // Update the result page Google Maps button
            document.getElementById('viewGoogleMapsResult').onclick = function() {
                let googleMapsUrl;
                
                // If we have a place name, use it for better Google Maps search
                if (savedLocation.placeName && savedLocation.placeName.trim() !== '') {
                    googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(savedLocation.placeName)}/@${lat.toFixed(6)},${lng.toFixed(6)},17z`;
                } else {
                    // Fall back to coordinates
                    googleMapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
                }
                
                window.open(googleMapsUrl, '_blank');
            };
            
            // Initialize the result map
            if (!resultMap) {
                resultMap = L.map('resultMap').setView([lat, lng], 16);
                
                // Create custom marker icon for result map
                const markerHtml = `<div class="marker-pin"></div>`;
                const customIcon = L.divIcon({
                    html: markerHtml,
                    className: '',
                    iconSize: [30, 42],
                    iconAnchor: [15, 42]
                });
                
                // Use the same tile layer as the main map for consistency
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19
                }).addTo(resultMap);
                
                // Add marker to the result map
                L.marker([lat, lng], {
                    icon: customIcon
                }).addTo(resultMap)
                .bindPopup(`<strong>${savedLocation.district}</strong><br>${savedLocation.address}`)
                .openPopup();
                
                // Disable zoom/drag on result map
                resultMap.dragging.disable();
                resultMap.touchZoom.disable();
                resultMap.doubleClickZoom.disable();
                resultMap.scrollWheelZoom.disable();
                
            } else {
                // Update existing map
                resultMap.setView([lat, lng], 16);
                // Clear existing markers
                resultMap.eachLayer(function(layer) {
                    if (layer instanceof L.Marker) {
                        resultMap.removeLayer(layer);
                    }
                });
                
                // Create custom marker icon for result map
                const markerHtml = `<div class="marker-pin"></div>`;
                const customIcon = L.divIcon({
                    html: markerHtml,
                    className: '',
                    iconSize: [30, 42],
                    iconAnchor: [15, 42]
                });
                
                // Add new marker
                L.marker([lat, lng], {
                    icon: customIcon
                }).addTo(resultMap)
                .bindPopup(`<strong>${savedLocation.district}</strong><br>${savedLocation.address}`)
                .openPopup();
            }
        }
        
        function showPage1() {
            document.getElementById('page1').style.display = 'block';
            document.getElementById('page2').style.display = 'none';
            
            // Update the map size
            if (map) {
                setTimeout(function() {
                    map.invalidateSize();
                }, 100);
            }
        }
        
        function showPage2() {
            document.getElementById('page1').style.display = 'none';
            document.getElementById('page2').style.display = 'block';
            
            // Update the result map size
            if (resultMap) {
                setTimeout(function() {
                    resultMap.invalidateSize();
                }, 100);
            }
        }