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

    // Map functionality
    if (document.getElementById('map')) {
        initializeMap();
    }
});

// Map initialization and click handling
function initializeMap() {
    // Initialize the map centered on India
    const map = L.map('map').setView([20.5937, 78.9629], 5);

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

    try {
        // Show loading overlay
        loadingOverlay.classList.remove('hidden');

        // Fetch data from API
        const response = await fetch(`https://jal-sutra.vercel.app/api/readings/location?lat=${lat}&lng=${lng}&radius=1`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch water quality data');
        }

        const data = await response.json();
        
        // Hide loading overlay
        loadingOverlay.classList.add('hidden');

        // Display statistics in modal
        displayWaterQualityStats(data, statsContent);
        modal.classList.remove('hidden');

        // Add a marker at the clicked location
        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup(`
            <div class="text-center p-2">
                <strong>Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}</strong><br>
                <small>Click for detailed statistics</small>
            </div>
        `);

    } catch (error) {
        console.error('Error fetching water quality data:', error);
        loadingOverlay.classList.add('hidden');
        
        // Show error in modal
        statsContent.innerHTML = `
            <div class="text-red-400 text-center p-4">
                <p class="mb-2">Error loading water quality data</p>
                <p class="text-sm">Please try again later</p>
            </div>
        `;
        modal.classList.remove('hidden');
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

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Location Info -->
            <div class="text-center border-b border-gray-600 pb-4">
                <h4 class="text-lg font-semibold mb-2">Location: ${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°</h4>
                <p class="text-gray-300">Radius: ${location.radius} km</p>
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

// Load existing data points on the map
async function loadExistingDataPoints(map) {
    try {
        const response = await fetch('https://jal-sutra.vercel.app/api/readings');
        if (response.ok) {
            const data = await response.json();
            const readings = data.data || [];

            // Add markers for existing readings (with sample coordinates)
            readings.forEach((reading, index) => {
                // Generate sample coordinates around major Indian cities
                const cities = [
                    {lat: 28.6139, lng: 77.2090, name: 'Delhi'},
                    {lat: 19.0760, lng: 72.8777, name: 'Mumbai'},
                    {lat: 13.0827, lng: 80.2707, name: 'Chennai'},
                    {lat: 22.5726, lng: 88.3639, name: 'Kolkata'},
                    {lat: 12.9716, lng: 77.5946, name: 'Bangalore'}
                ];
                
                const city = cities[index % cities.length];
                const lat = city.lat + (Math.random() - 0.5) * 0.5;
                const lng = city.lng + (Math.random() - 0.5) * 0.5;

                const marker = L.marker([lat, lng]).addTo(map);
                marker.bindPopup(`
                    <div class="p-2">
                        <strong>${reading.sample_id}</strong><br>
                        Location: ${reading.location}<br>
                        Date: ${reading.date}<br>
                        <small>Click map for detailed analysis</small>
                    </div>
                `);
            });
        }
    } catch (error) {
        console.error('Error loading existing data points:', error);
    }
}

// Modal close functionality
document.addEventListener('DOMContentLoaded', () => {
    const closeModal = document.getElementById('closeModal');
    const modal = document.getElementById('statsModal');
    
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
});
