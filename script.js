document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    const topNavItems = document.querySelectorAll('.nav-item');
    topNavItems.forEach(item => {
        const itemHref = item.getAttribute('href');
        if (itemHref && itemHref.includes(currentPage)) {
            item.classList.add('active');
        }
    });

    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        const itemHref = item.getAttribute('href');
        if (itemHref && itemHref.includes(currentPage)) {
            item.classList.add('active');
        }
    });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const statusMessage = document.getElementById('statusMessage');

            try {
                const response = await fetch('https://jal-sutra.vercel.app/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    statusMessage.textContent = 'Login successful! Redirecting...';
                    statusMessage.style.color = '#34d399';
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    const errorData = await response.json();
                    statusMessage.textContent = errorData.message || 'Invalid username or password.';
                    statusMessage.style.color = '#f87171';
                }
            } catch (error) {
                statusMessage.textContent = 'Login failed. Could not connect to the server.';
                statusMessage.style.color = '#f87171';
                console.error('Login error:', error);
            }
        });
    }

    const sampleForm = document.getElementById('sampleForm');
    if (sampleForm) {
        sampleForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitButton = document.getElementById('submitButton');
            const statusMessage = document.getElementById('statusMessage');

            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;

            try {
                const dataToSend = {
                    sampleId: document.getElementById('sampleId').value,
                    date: document.getElementById('date').value,
                    depth: parseFloat(document.getElementById('depth').value) || 0,
                    location: document.getElementById('location').value,
                    latitude: parseFloat(document.getElementById('latitude').value),
                    longitude: parseFloat(document.getElementById('longitude').value),
                    metals: {
                        lead: parseFloat(document.getElementById('lead').value) || 0,
                        cadmium: parseFloat(document.getElementById('cadmium').value) || 0,
                        chromium: parseFloat(document.getElementById('chromium').value) || 0,
                        arsenic: parseFloat(document.getElementById('arsenic').value) || 0,
                        mercury: parseFloat(document.getElementById('mercury').value) || 0,
                    }
                };
                
                const response = await fetch('https://jal-sutra.vercel.app/add-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataToSend)
                });

                if (response.ok) {
                    statusMessage.textContent = 'Sample data submitted successfully!';
                    statusMessage.style.color = '#34d399';
                    sampleForm.reset();
                } else {
                    const errorData = await response.json();
                    statusMessage.textContent = errorData.message || 'Submission failed. Please try again.';
                    statusMessage.style.color = '#f87171';
                }
                submitButton.textContent = 'Submit Sample';
                submitButton.disabled = false;

            } catch (error) {
                statusMessage.textContent = 'Submission failed. Please check your data.';
                statusMessage.style.color = '#f87171';
                console.error('Submission error:', error);
                submitButton.textContent = 'Submit Sample';
                submitButton.disabled = false;
            }
        });
    }

    // Water quality index calculation logic remains the same
    const standards = { lead: 0.01, cadmium: 0.003, chromium: 0.05, arsenic: 0.01, mercury: 0.006 };
    function calculateIndices() {
        const concentrations = {
            lead: parseFloat(document.getElementById('lead').value) || 0,
            cadmium: parseFloat(document.getElementById('cadmium').value) || 0,
            chromium: parseFloat(document.getElementById('chromium').value) || 0,
            arsenic: parseFloat(document.getElementById('arsenic').value) || 0,
            mercury: parseFloat(document.getElementById('mercury').value) || 0
        };
        const metals = Object.keys(standards);
        const n = metals.length;
        let sumWQi = 0; let sumW = 0; let hei = 0; let cd = 0; let sumCS = 0;
        metals.forEach((metal) => {
            const C = concentrations[metal]; const S = standards[metal];
            const W = 1 / S; const Q = (C / S) * 100;
            sumWQi += W * Q; sumW += W; hei += C / S; cd += (C / S) - 1; sumCS += C / S;
        });
        const hpi = sumWQi / sumW; const mcd = sumCS / n;
        const hpiInterp = hpi < 100 ? { text: 'Low Pollution', class: 'low' } : { text: 'High Pollution', class: 'high' };
        const heiInterp = hei < 10 ? { text: 'Low', class: 'low' } : (hei < 20 ? { text: 'Medium', class: 'medium' } : { text: 'High', class: 'high' });
        const cdInterp = cd < 1 ? { text: 'Low', class: 'low' } : (cd < 3 ? { text: 'Medium', class: 'medium' } : { text: 'High', class: 'high' });
        let mcdInterp;
        if (mcd < 1.5) mcdInterp = { text: 'Nil to Very Low', class: 'very-low' };
        else if (mcd < 2) mcdInterp = { text: 'Low', class: 'low' };
        else if (mcd < 4) mcdInterp = { text: 'Moderate', class: 'moderate' };
        else if (mcd < 8) mcdInterp = { text: 'High', class: 'high' };
        else if (mcd < 16) mcdInterp = { text: 'Very High', class: 'very-high' };
        else mcdInterp = { text: 'Ultra High', class: 'ultra-high' };
        const resultContent = document.getElementById('result-content');
        resultContent.innerHTML = `<div class="result-item">HPI: <span class="result-value">${hpi.toFixed(2)}</span> <span class="interpretation ${hpiInterp.class}">${hpiInterp.text}</span></div><div class="result-item">HEI: <span class="result-value">${hei.toFixed(2)}</span> <span class="interpretation ${heiInterp.class}">${heiInterp.text}</span></div><div class="result-item">Cd: <span class="result-value">${cd.toFixed(2)}</span> <span class="interpretation ${cdInterp.class}">${cdInterp.text}</span></div><div class="result-item">mCd: <span class="result-value">${mcd.toFixed(2)}</span> <span class="interpretation ${mcdInterp.class}">${mcdInterp.text}</span></div>`;
        document.getElementById('results').style.display = 'block';
    }
    function resetInputs() {
        ['lead', 'cadmium', 'chromium', 'arsenic', 'mercury'].forEach(id => {
            document.getElementById(id).value = '';
        });
        document.getElementById('results').style.display = 'none';
    }
    const calculationForm = document.getElementById('calculationForm');
    if (calculationForm) {
        calculationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculateIndices();
        });
    }
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
        resetButton.addEventListener('click', resetInputs);
    }

    // Geolocation functionality for "Use Current Location" button
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    if (getCurrentLocationBtn) {
        getCurrentLocationBtn.addEventListener('click', getCurrentLocation);
    }

    // Map functionality
    if (document.getElementById('map')) {
        initializeMap();
    }
});

// Geolocation functionality
function getCurrentLocation() {
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const locationStatusDiv = document.getElementById('locationStatus');
    const locationStatusIcon = document.getElementById('locationStatusIcon');
    const locationStatusText = document.getElementById('locationStatusText');
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    
    // Show loading state
    if (getCurrentLocationBtn) {
        getCurrentLocationBtn.disabled = true;
        getCurrentLocationBtn.innerHTML = `
            <span class="material-symbols-outlined text-sm animate-pulse">location_searching</span>
            <span>Getting Location...</span>
        `;
    }
    
    // Show loading status
    showLocationStatus('location_searching', 'Getting your current location...', 'loading');
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
        showLocationStatus('error', 'Geolocation is not supported by this browser.', 'error');
        resetLocationButton();
        return;
    }
    
    // Get current position
    navigator.geolocation.getCurrentPosition(
        // Success callback
        function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            // Update form fields
            if (latitudeInput) latitudeInput.value = latitude.toFixed(6);
            if (longitudeInput) longitudeInput.value = longitude.toFixed(6);
            
            // Show success status
            const accuracyText = accuracy < 100 ? 'High accuracy' : accuracy < 1000 ? 'Medium accuracy' : 'Low accuracy';
            showLocationStatus(
                'check_circle', 
                `Location obtained successfully! (${accuracyText}: ±${Math.round(accuracy)}m)`,
                'success'
            );
            
            // Try to get address information (optional)
            reverseGeocode(latitude, longitude);
            
            resetLocationButton();
            
            console.log(`📍 Current location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`);
        },
        
        // Error callback
        function(error) {
            let errorMessage = '';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied by user. Please enable location permissions.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information is unavailable. Please check your GPS/network.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out. Please try again.';
                    break;
                default:
                    errorMessage = 'An unknown error occurred while retrieving location.';
                    break;
            }
            
            showLocationStatus('error', errorMessage, 'error');
            resetLocationButton();
            
            console.error('Geolocation error:', error.message);
        },
        
        // Options
        {
            enableHighAccuracy: true, // Use GPS if available
            timeout: 10000,          // 10 second timeout
            maximumAge: 60000        // Accept 1-minute old position
        }
    );
}

// Function to show location status messages
function showLocationStatus(icon, message, type) {
    const locationStatusDiv = document.getElementById('locationStatus');
    const locationStatusIcon = document.getElementById('locationStatusIcon');
    const locationStatusText = document.getElementById('locationStatusText');
    
    if (!locationStatusDiv || !locationStatusIcon || !locationStatusText) return;
    
    // Update icon and text
    locationStatusIcon.textContent = icon;
    locationStatusText.textContent = message;
    
    // Update styling based on type
    locationStatusDiv.className = locationStatusDiv.className.replace(/bg-\[var\(--[^\]]+\)\]\/\d+/g, '');
    locationStatusDiv.className = locationStatusDiv.className.replace(/border-\[var\(--[^\]]+\)\]\/\d+/g, '');
    locationStatusIcon.className = locationStatusIcon.className.replace(/text-\[var\(--[^\]]+\)\]/g, '');
    locationStatusText.className = locationStatusText.className.replace(/text-\[var\(--[^\]]+\)\]/g, '');
    
    switch(type) {
        case 'loading':
            locationStatusDiv.className += ' bg-blue-900/20 border-blue-500/30';
            locationStatusIcon.className += ' text-blue-400';
            locationStatusText.className += ' text-blue-300';
            break;
        case 'success':
            locationStatusDiv.className += ' bg-green-900/20 border-green-500/30';
            locationStatusIcon.className += ' text-green-400';
            locationStatusText.className += ' text-green-300';
            break;
        case 'error':
            locationStatusDiv.className += ' bg-red-900/20 border-red-500/30';
            locationStatusIcon.className += ' text-red-400';
            locationStatusText.className += ' text-red-300';
            break;
    }
    
    // Show the status div
    locationStatusDiv.classList.remove('hidden');
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            locationStatusDiv.classList.add('hidden');
        }, 5000);
    }
}

// Function to reset the location button to its original state
function resetLocationButton() {
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    if (getCurrentLocationBtn) {
        getCurrentLocationBtn.disabled = false;
        getCurrentLocationBtn.innerHTML = `
            <span class="material-symbols-outlined text-sm">my_location</span>
            <span>Use Current Location</span>
        `;
    }
}

// Optional: Reverse geocoding to get address information
function reverseGeocode(latitude, longitude) {
    // Using a simple approach with OpenStreetMap Nominatim (free service)
    // Note: In production, you might want to use a more reliable service
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.display_name) {
                const address = data.display_name;
                const locationInput = document.getElementById('location');
                
                // If location field is empty, suggest the geocoded address
                if (locationInput && (!locationInput.value || locationInput.value.trim() === '')) {
                    // Extract relevant parts of the address
                    const addressParts = [];
                    if (data.address) {
                        if (data.address.neighbourhood) addressParts.push(data.address.neighbourhood);
                        if (data.address.suburb) addressParts.push(data.address.suburb);
                        if (data.address.city) addressParts.push(data.address.city);
                        if (data.address.state) addressParts.push(data.address.state);
                    }
                    
                    const suggestedLocation = addressParts.length > 0 ? addressParts.join(', ') : address.split(',').slice(0, 3).join(', ');
                    locationInput.placeholder = `Suggested: ${suggestedLocation}`;
                    
                    console.log('📍 Address found:', suggestedLocation);
                }
            }
        })
        .catch(error => {
            console.log('ℹ️ Reverse geocoding failed (optional feature):', error.message);
        });
}

// Map initialization and click handling
function initializeMap() {
    // Initialize the map centered on India
    const map = L.map('map').setView([20.5937, 78.9629], 5);
    
    // Store map instance globally for marker popup access
    window.currentMap = map;

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
    }).addTo(map);

    // Add click event listener to the map
    map.on('click', async function(e) {
        const { lat, lng } = e.latlng;
        await fetchAndDisplayWaterQuality(lat, lng, map);
    });

    // Load existing water quality data points
    loadExistingDataPoints(map);
}

// Fetch water quality data for clicked location
async function fetchAndDisplayWaterQuality(lat, lng, map) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const modal = document.getElementById('statsModal');
    const statsContent = document.getElementById('statsContent');
    const dataDisplaySection = document.getElementById('dataDisplaySection');

    try {
        // Show loading overlay
        loadingOverlay.classList.remove('hidden');

        let data = null;
        
        try {
            // First, try to fetch data from API
            const response = await fetch(`https://jal-sutra.vercel.app/api/readings/location?lat=${lat}&lng=${lng}&radius=1`);
            
            if (response.ok) {
                data = await response.json();
                console.log('✅ Successfully fetched data from location API');
            } else {
                throw new Error('API returned error response');
            }
        } catch (apiError) {
            console.log('⚠️ Location API failed, using fallback data processing...');
            
            // Fallback: Load all readings data if not already cached
            if (!allReadingsData) {
                const allReadingsResponse = await fetch('https://jal-sutra.vercel.app/api/readings');
                if (allReadingsResponse.ok) {
                    const allReadingsResult = await allReadingsResponse.json();
                    allReadingsData = allReadingsResult.data || [];
                } else {
                    throw new Error('Failed to load readings data for fallback processing');
                }
            }
            
            // Find nearby readings and generate statistics
            const nearbyReadings = findNearbyReadings(lat, lng, allReadingsData);
            data = generateAreaStatistics(nearbyReadings, lat, lng);
            
            // Add some context about the data source
            const closestCity = Object.keys(cityCoordinates).reduce((closest, cityName) => {
                const cityCoords = cityCoordinates[cityName];
                const distance = Math.sqrt(
                    Math.pow(lat - cityCoords.lat, 2) + Math.pow(lng - cityCoords.lng, 2)
                );
                if (!closest || distance < closest.distance) {
                    return { cityName, distance };
                }
                return closest;
            }, null);
            
            if (closestCity) {
                data.city_name = closestCity.cityName;
                console.log(`📍 Generated statistics for ${data.area_statistics.total_samples} samples from ${closestCity.cityName}`);
            }
        }
        
        // Hide loading overlay
        loadingOverlay.classList.add('hidden');

        // Display statistics in modal AND below map
        displayWaterQualityStats(data, statsContent);
        displayDataBelowMap(data, lat, lng);
        
        // Show both modal and data section
        modal.classList.remove('hidden');
        dataDisplaySection.classList.remove('hidden');
        
        // Scroll to data section
        dataDisplaySection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Add a marker at the clicked location
        const marker = L.marker([lat, lng]).addTo(map);
        const cityInfo = data.city_name ? ` (${data.city_name} area)` : '';
        marker.bindPopup(`
            <div class="text-center p-2">
                <strong>Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}</strong><br>
                <small>Data displayed below map${cityInfo}</small>
            </div>
        `);

    } catch (error) {
        console.error('Error processing water quality data:', error);
        loadingOverlay.classList.add('hidden');
        
        // Show error in modal and data section
        const errorMessage = `
            <div class="text-red-400 text-center p-4">
                <p class="mb-2">Error loading water quality data</p>
                <p class="text-sm">${error.message}</p>
                <p class="text-xs mt-2">Please try clicking on a different area or refresh the page</p>
            </div>
        `;
        statsContent.innerHTML = errorMessage;
        modal.classList.remove('hidden');
        
        // Show error in data section
        dataDisplaySection.classList.remove('hidden');
        document.getElementById('hardnessDescription').textContent = 'Error loading data - ' + error.message;
        document.getElementById('metalDescription').textContent = 'Error loading data - ' + error.message;
    }
}

// Display water quality statistics in the modal
function displayWaterQualityStats(data, container) {
    const { area_statistics, location, readings } = data;
    
    let hardnessColor = 'text-green-400';
    if (area_statistics.avg_hardness > 300) hardnessColor = 'text-red-400';
    else if (area_statistics.avg_hardness > 180) hardnessColor = 'text-orange-400';
    else if (area_statistics.avg_hardness > 60) hardnessColor = 'text-yellow-400';

    let pollutionColor = 'text-green-400';
    if (area_statistics.avg_pollution_index > 100) pollutionColor = 'text-red-400';
    else if (area_statistics.avg_pollution_index > 50) pollutionColor = 'text-orange-400';

    // Determine if we're using fallback data
    const cityName = data.city_name;
    const dataSource = cityName ? `${cityName.charAt(0).toUpperCase() + cityName.slice(1)} Area` : 'Selected Area';
    const dataSourceNote = cityName ? '<p class="text-xs text-gray-400 mt-1">📍 Data from city-based samples</p>' : '';

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Location Info -->
            <div class="text-center border-b border-gray-600 pb-4">
                <h4 class="text-lg font-semibold mb-2">${dataSource}</h4>
                <p class="text-gray-300">Coordinates: ${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°</p>
                <p class="text-gray-300">Analysis Radius: ${location.radius} km</p>
                ${dataSourceNote}
            </div>

            <!-- Summary Statistics -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="glassmorphism p-4 rounded-lg">
                    <h5 class="font-semibold mb-2 text-[var(--accent-color)]">Water Hardness</h5>
                    <p class="text-2xl font-bold ${hardnessColor}">${area_statistics.avg_hardness.toFixed(2)} mg/L</p>
                    <p class="text-sm text-gray-400">CaCO3 equivalent</p>
                </div>
                
                <div class="glassmorphism p-4 rounded-lg">
                    <h5 class="font-semibold mb-2 text-[var(--accent-color)]">Pollution Index</h5>
                    <p class="text-2xl font-bold ${pollutionColor}">${area_statistics.avg_pollution_index.toFixed(2)}</p>
                    <p class="text-sm text-gray-400">HPI Average</p>
                </div>
            </div>

            <!-- Hardness Distribution -->
            <div class="glassmorphism p-4 rounded-lg">
                <h5 class="font-semibold mb-3 text-[var(--accent-color)]">Water Hardness Distribution</h5>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-green-400">Soft:</span>
                        <span>${area_statistics.hardness_distribution.soft} samples</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-yellow-400">Moderately Hard:</span>
                        <span>${area_statistics.hardness_distribution.moderately_hard} samples</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-orange-400">Hard:</span>
                        <span>${area_statistics.hardness_distribution.hard} samples</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-red-400">Very Hard:</span>
                        <span>${area_statistics.hardness_distribution.very_hard} samples</span>
                    </div>
                </div>
            </div>

            <!-- Sample Information -->
            <div class="glassmorphism p-4 rounded-lg">
                <h5 class="font-semibold mb-2 text-[var(--accent-color)]">Sample Information</h5>
                <p class="text-gray-300">Total samples in area: <span class="text-white font-semibold">${area_statistics.total_samples}</span></p>
            </div>

            <!-- Recent Readings -->
            ${readings && readings.length > 0 ? `
                <div class="glassmorphism p-4 rounded-lg">
                    <h5 class="font-semibold mb-3 text-[var(--accent-color)]">Recent Readings</h5>
                    <div class="max-h-60 overflow-y-auto space-y-2">
                        ${readings.slice(0, 5).map(reading => `
                            <div class="border border-gray-600 p-3 rounded text-sm">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="font-medium">${reading.sample_id}</span>
                                    <span class="text-gray-400">${reading.date}</span>
                                </div>
                                <div class="text-xs text-gray-300">
                                    <p>Location: ${reading.location}</p>
                                    <p>Hardness: <span class="${reading.water_hardness.value > 300 ? 'text-red-400' : reading.water_hardness.value > 180 ? 'text-orange-400' : reading.water_hardness.value > 60 ? 'text-yellow-400' : 'text-green-400'}">${reading.water_hardness.value.toFixed(2)} mg/L (${reading.water_hardness.category})</span></p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Water Quality Indicators -->
            <div class="glassmorphism p-4 rounded-lg">
                <h5 class="font-semibold mb-3 text-[var(--accent-color)]">Water Quality Indicators</h5>
                <div class="text-sm space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-300">Hardness Classification:</span>
                        <span class="${hardnessColor}">
                            ${area_statistics.avg_hardness < 60 ? 'Soft' : 
                              area_statistics.avg_hardness < 180 ? 'Moderately Hard' :
                              area_statistics.avg_hardness < 300 ? 'Hard' : 'Very Hard'}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-300">Pollution Level:</span>
                        <span class="${pollutionColor}">
                            ${area_statistics.avg_pollution_index < 25 ? 'Low' :
                              area_statistics.avg_pollution_index < 50 ? 'Moderate' :
                              area_statistics.avg_pollution_index < 100 ? 'High' : 'Very High'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// City coordinate mapping for major Indian cities
const cityCoordinates = {
    'delhi': { lat: 28.6139, lng: 77.2090 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'kolkata': { lat: 22.5726, lng: 88.3639 },
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'pune': { lat: 18.5204, lng: 73.8567 },
    'ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'lucknow': { lat: 26.8467, lng: 80.9462 },
    'kanpur': { lat: 26.4499, lng: 80.3319 },
    'nagpur': { lat: 21.1458, lng: 79.0882 },
    'indore': { lat: 22.7196, lng: 75.8577 },
    'thane': { lat: 19.2183, lng: 72.9781 },
    'bhopal': { lat: 23.2599, lng: 77.4126 },
    'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
    'patna': { lat: 25.5941, lng: 85.1376 },
    'vadodara': { lat: 22.3072, lng: 73.1812 },
    'ghaziabad': { lat: 28.6692, lng: 77.4538 },
    'pimpri-chinchwad': { lat: 18.6298, lng: 73.7997 }
};

// Function to extract city name from location string
function extractCityFromLocation(locationString) {
    if (!locationString) return null;
    
    // Extract the city name before the first ' - '
    const parts = locationString.split(' - ');
    if (parts.length > 0) {
        return parts[0].toLowerCase().trim();
    }
    return null;
}

// Function to get coordinates for a reading (actual or fallback)
function getReadingCoordinates(reading) {
    // If actual coordinates exist, use them
    if (reading.latitude && reading.longitude) {
        return {
            lat: reading.latitude,
            lng: reading.longitude,
            isExact: true
        };
    }
    
    // Otherwise, try to get city coordinates from location string
    const cityName = extractCityFromLocation(reading.location);
    if (cityName && cityCoordinates[cityName]) {
        // Add small random offset to avoid markers stacking exactly
        const baseCoords = cityCoordinates[cityName];
        const offset = 0.01; // Approximately 1km
        return {
            lat: baseCoords.lat + (Math.random() - 0.5) * offset,
            lng: baseCoords.lng + (Math.random() - 0.5) * offset,
            isExact: false,
            cityName: cityName
        };
    }
    
    return null;
}

// Load existing data points on the map
async function loadExistingDataPoints(map) {
    try {
        const response = await fetch('https://jal-sutra.vercel.app/api/readings');
        if (response.ok) {
            const data = await response.json();
            const readings = data.data || [];

            // Add markers for existing readings using actual or fallback coordinates
            readings.forEach((reading) => {
                const coords = getReadingCoordinates(reading);
                
                if (coords) {
                    // Create marker with appropriate color based on coordinate source
                    const markerOptions = coords.isExact ? 
                        { } : // Default marker for exact coordinates
                        { opacity: 0.7 }; // Slightly transparent for approximate coordinates
                    
                    const marker = L.marker([coords.lat, coords.lng], markerOptions).addTo(map);
                    
                    // Create popup content with appropriate coordinate display
                    const coordDisplay = coords.isExact ? 
                        `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` :
                        `~${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} (approx.)`;
                    
                    const coordinateLabel = coords.isExact ? 'Exact Coordinates:' : 'Approximate Coordinates:';
                    
                    marker.bindPopup(`
                        <div class="p-2">
                            <strong>${reading.sample_id}</strong><br>
                            Location: ${reading.location}<br>
                            Date: ${reading.date}<br>
                            ${coordinateLabel} ${coordDisplay}<br>
                            ${coords.isExact ? '' : '<small class="text-gray-500">*Based on city location</small><br>'}
                            <button onclick="showAreaData(${coords.lat}, ${coords.lng})" 
                                    class="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                                Show Area Data
                            </button>
                        </div>
                    `);
                }
            });
            
            // Count how many markers were placed with exact vs approximate coordinates
            let exactCount = 0;
            let approximateCount = 0;
            let skippedCount = 0;
            
            readings.forEach(reading => {
                const coords = getReadingCoordinates(reading);
                if (coords) {
                    if (coords.isExact) exactCount++;
                    else approximateCount++;
                } else {
                    skippedCount++;
                }
            });
            
            console.log(`Loaded ${readings.length} water quality readings on map:`);
            console.log(`- ${exactCount} with exact coordinates`);
            console.log(`- ${approximateCount} with approximate coordinates (city-based)`);
            console.log(`- ${skippedCount} skipped (no location data)`);
            
            if (approximateCount > 0) {
                console.log('Note: Markers with approximate coordinates are slightly transparent and show "(approx.)" in popups');
            }
        }
    } catch (error) {
        console.error('Error loading existing data points:', error);
    }
}

// Function to show area data from marker popup
window.showAreaData = async function(lat, lng) {
    // Get the map instance (we need to store it globally)
    if (window.currentMap) {
        await fetchAndDisplayWaterQuality(lat, lng, window.currentMap);
    }
};

// Client-side data processing for water quality statistics
let allReadingsData = null; // Cache for readings data

// Function to calculate water hardness from metal concentrations
function calculateWaterHardness(reading) {
    // Using simplified hardness calculation based on available data
    // In absence of Ca/Mg data, we'll use an approximation based on heavy metals
    const baseHardness = 120; // Average baseline hardness for Indian cities
    const metalFactor = (reading.lead + reading.cadmium + reading.chromium + reading.arsenic + reading.mercury) * 1000;
    const calculatedHardness = baseHardness + metalFactor;
    
    let category = 'Soft';
    if (calculatedHardness >= 300) category = 'Very Hard';
    else if (calculatedHardness >= 180) category = 'Hard';
    else if (calculatedHardness >= 60) category = 'Moderately Hard';
    
    return {
        value: calculatedHardness,
        category: category
    };
}

// Function to calculate Heavy Metal Pollution Index (HPI)
function calculateHPI(reading) {
    const standards = {
        lead: 0.010,
        cadmium: 0.003,
        chromium: 0.050,
        arsenic: 0.010,
        mercury: 0.006
    };
    
    const metals = ['lead', 'cadmium', 'chromium', 'arsenic', 'mercury'];
    let sumWQi = 0;
    let sumW = 0;
    
    metals.forEach(metal => {
        const C = reading[metal] || 0;
        const S = standards[metal];
        const W = 1 / S;
        const Q = (C / S) * 100;
        sumWQi += W * Q;
        sumW += W;
    });
    
    return sumWQi / sumW;
}

// Function to find readings near a location (by city)
function findNearbyReadings(lat, lng, allReadings) {
    // Find the closest city to the clicked coordinates
    let closestCity = null;
    let minDistance = Infinity;
    
    Object.keys(cityCoordinates).forEach(cityName => {
        const cityCoords = cityCoordinates[cityName];
        const distance = Math.sqrt(
            Math.pow(lat - cityCoords.lat, 2) + Math.pow(lng - cityCoords.lng, 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            closestCity = cityName;
        }
    });
    
    if (!closestCity) return [];
    
    // Find all readings from this city
    return allReadings.filter(reading => {
        const readingCity = extractCityFromLocation(reading.location);
        return readingCity === closestCity;
    });
}

// Function to generate area statistics from readings
function generateAreaStatistics(readings, lat, lng) {
    if (!readings || readings.length === 0) {
        return {
            area_statistics: {
                total_samples: 0,
                avg_hardness: 0,
                avg_pollution_index: 0,
                hardness_distribution: {
                    soft: 0,
                    moderately_hard: 0,
                    hard: 0,
                    very_hard: 0
                }
            },
            location: {
                latitude: lat,
                longitude: lng,
                radius: 1
            },
            readings: []
        };
    }
    
    // Process each reading to add calculated fields
    const processedReadings = readings.map(reading => {
        const waterHardness = calculateWaterHardness(reading);
        const pollutionIndex = calculateHPI(reading);
        
        return {
            ...reading,
            water_hardness: waterHardness,
            pollution_index: pollutionIndex,
            concentrations: {
                lead: reading.lead || 0,
                cadmium: reading.cadmium || 0,
                chromium: reading.chromium || 0,
                arsenic: reading.arsenic || 0,
                mercury: reading.mercury || 0
            }
        };
    });
    
    // Calculate averages
    const avgHardness = processedReadings.reduce((sum, r) => sum + r.water_hardness.value, 0) / processedReadings.length;
    const avgPollution = processedReadings.reduce((sum, r) => sum + r.pollution_index, 0) / processedReadings.length;
    
    // Calculate hardness distribution
    const distribution = {
        soft: 0,
        moderately_hard: 0,
        hard: 0,
        very_hard: 0
    };
    
    processedReadings.forEach(reading => {
        const category = reading.water_hardness.category;
        if (category === 'Soft') distribution.soft++;
        else if (category === 'Moderately Hard') distribution.moderately_hard++;
        else if (category === 'Hard') distribution.hard++;
        else if (category === 'Very Hard') distribution.very_hard++;
    });
    
    return {
        area_statistics: {
            total_samples: processedReadings.length,
            avg_hardness: avgHardness,
            avg_pollution_index: avgPollution,
            hardness_distribution: distribution
        },
        location: {
            latitude: lat,
            longitude: lng,
            radius: 1
        },
        readings: processedReadings
    };
}

// Display water quality data below the map
function displayDataBelowMap(data, lat, lng) {
    const { area_statistics, location, readings } = data;
    
    // Update quick stats cards
    document.getElementById('displayTotalSamples').textContent = area_statistics.total_samples;
    document.getElementById('displayAvgHardness').textContent = area_statistics.avg_hardness.toFixed(1);
    document.getElementById('displayAvgHardness').className = getHardnessColor(area_statistics.avg_hardness) + ' text-2xl font-bold';
    
    document.getElementById('displayPollutionIndex').textContent = area_statistics.avg_pollution_index.toFixed(1);
    document.getElementById('displayPollutionIndex').className = getPollutionColor(area_statistics.avg_pollution_index) + ' text-2xl font-bold';
    
    document.getElementById('displayLocation').textContent = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
    
    // Update hardness analysis
    updateHardnessDisplay(area_statistics);
    
    // Update metal analysis
    updateMetalDisplay(readings);
    
    // Update readings table
    updateReadingsTable(readings);
}

function updateHardnessDisplay(stats) {
    const hardness = stats.avg_hardness;
    
    // Update main hardness display
    document.getElementById('detailedHardness').textContent = `${hardness.toFixed(2)} mg/L`;
    
    // Update hardness bar (scale to 500 mg/L max)
    const percentage = Math.min((hardness / 500) * 100, 100);
    document.getElementById('hardnessBar').style.width = `${percentage}%`;
    
    // Update distribution counts
    document.getElementById('softCount').textContent = stats.hardness_distribution.soft;
    document.getElementById('modHardCount').textContent = stats.hardness_distribution.moderately_hard;
    document.getElementById('hardCount').textContent = stats.hardness_distribution.hard;
    document.getElementById('veryHardCount').textContent = stats.hardness_distribution.very_hard;
    
    // Update classification
    const classification = getHardnessClassification(hardness);
    document.getElementById('hardnessClassification').textContent = classification;
    document.getElementById('hardnessClassification').className = getHardnessColor(hardness) + ' font-semibold';
    
    document.getElementById('hardnessDescription').textContent = getHardnessDescription(hardness);
}

function updateMetalDisplay(readings) {
    const standards = {
        lead: 0.010,
        cadmium: 0.003,
        chromium: 0.050,
        arsenic: 0.010,
        mercury: 0.006
    };
    
    const metals = ['lead', 'cadmium', 'chromium', 'arsenic', 'mercury'];
    let overallSafe = true;
    
    if (readings && readings.length > 0) {
        metals.forEach(metal => {
            // Calculate average for this metal
            const total = readings.reduce((sum, reading) => {
                return sum + (reading.concentrations[metal] || 0);
            }, 0);
            const average = total / readings.length;
            const standard = standards[metal];
            
            // Update display
            document.getElementById(`avg${metal.charAt(0).toUpperCase() + metal.slice(1)}`).textContent = `${average.toFixed(4)} mg/L`;
            
            // Update progress bar
            const percentage = Math.min((average / standard) * 100, 100);
            document.getElementById(`${metal}Bar`).style.width = `${percentage}%`;
            
            // Update status
            const isSafe = average <= standard;
            const statusElement = document.getElementById(`${metal}Status`);
            statusElement.textContent = isSafe ? 'Safe' : 'Exceeded';
            statusElement.className = isSafe ? 'text-green-400' : 'text-red-400';
            
            if (!isSafe) overallSafe = false;
        });
    } else {
        // No readings available
        metals.forEach(metal => {
            document.getElementById(`avg${metal.charAt(0).toUpperCase() + metal.slice(1)}`).textContent = 'N/A';
            document.getElementById(`${metal}Bar`).style.width = '0%';
            document.getElementById(`${metal}Status`).textContent = 'No data';
        });
    }
    
    // Update overall status
    const overallStatus = document.getElementById('overallMetalStatus');
    if (readings && readings.length > 0) {
        overallStatus.textContent = overallSafe ? 'All metals within safe limits' : 'Some metals exceed safe limits';
        overallStatus.className = overallSafe ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold';
        document.getElementById('metalDescription').textContent = overallSafe ? 
            'Heavy metal concentrations are within WHO recommended standards' : 
            'Some heavy metals exceed WHO standards and require attention';
    } else {
        overallStatus.textContent = 'No data available';
        overallStatus.className = 'text-gray-400 font-semibold';
        document.getElementById('metalDescription').textContent = 'No readings found in this area';
    }
}

function updateReadingsTable(readings) {
    const tbody = document.getElementById('readingsTableBody');
    
    if (!readings || readings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-400">No readings found in this area</td>
            </tr>
        `;
        return;
    }
    
    // Show up to 10 most recent readings
    const recentReadings = readings.slice(0, 10);
    
    tbody.innerHTML = recentReadings.map(reading => {
        const hardnessColor = getHardnessColor(reading.water_hardness.value);
        
        // Get coordinates (actual or fallback)
        const coords = getReadingCoordinates(reading);
        let coordinateDisplay = 'N/A';
        
        if (coords) {
            if (coords.isExact) {
                coordinateDisplay = `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
            } else {
                coordinateDisplay = `~${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}<br><small class="text-gray-500">(${coords.cityName} approx.)</small>`;
            }
        }
        
        return `
            <tr class="border-b border-gray-700 hover:bg-gray-800/50">
                <td class="py-3 font-mono text-[var(--accent-color)]">${reading.sample_id}</td>
                <td class="py-3 text-gray-300">${reading.location}</td>
                <td class="py-3 text-gray-300">${reading.date}</td>
                <td class="py-3 text-center">
                    <span class="${hardnessColor} font-semibold">${reading.water_hardness.value.toFixed(1)} mg/L</span>
                </td>
                <td class="py-3 text-center">
                    <span class="${hardnessColor} text-sm">${reading.water_hardness.category}</span>
                </td>
                <td class="py-3 text-center text-xs text-gray-400 font-mono">
                    ${coordinateDisplay}
                </td>
            </tr>
        `;
    }).join('');
}

// Helper functions for styling and classification
function getHardnessColor(hardness) {
    if (hardness < 60) return 'text-green-400';
    if (hardness < 180) return 'text-yellow-400';
    if (hardness < 300) return 'text-orange-400';
    return 'text-red-400';
}

function getPollutionColor(pollution) {
    if (pollution < 25) return 'text-green-400';
    if (pollution < 50) return 'text-yellow-400';
    if (pollution < 100) return 'text-orange-400';
    return 'text-red-400';
}

function getHardnessClassification(hardness) {
    if (hardness < 60) return 'Soft Water';
    if (hardness < 180) return 'Moderately Hard';
    if (hardness < 300) return 'Hard Water';
    return 'Very Hard Water';
}

function getHardnessDescription(hardness) {
    if (hardness < 60) return 'Excellent for drinking and household use';
    if (hardness < 180) return 'Good quality, minimal treatment needed';
    if (hardness < 300) return 'May require softening for some applications';
    return 'Requires treatment before consumption';
}

// Modal close functionality
document.addEventListener('DOMContentLoaded', () => {
    const closeModal = document.getElementById('closeModal');
    const modal = document.getElementById('statsModal');
    const clearSelection = document.getElementById('clearSelection');
    const viewFullModal = document.getElementById('viewFullModal');
    const dataDisplaySection = document.getElementById('dataDisplaySection');
    
    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }
    
    // Clear selection button
    if (clearSelection && dataDisplaySection) {
        clearSelection.addEventListener('click', () => {
            dataDisplaySection.classList.add('hidden');
            modal.classList.add('hidden');
        });
    }
    
    // View full modal button
    if (viewFullModal && modal) {
        viewFullModal.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
    }
});
