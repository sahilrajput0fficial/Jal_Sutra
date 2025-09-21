import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Demo data configuration
const API_BASE_URL = 'https://jal-sutra.vercel.app';
const TOTAL_SAMPLES = 100;

// Indian cities and regions with accurate coordinates
const indianLocations = [
    { name: 'Delhi', lat: 28.6139, lng: 77.2090, region: 'NCR' },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, region: 'Maharashtra' },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946, region: 'Karnataka' },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707, region: 'Tamil Nadu' },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639, region: 'West Bengal' },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, region: 'Telangana' },
    { name: 'Pune', lat: 18.5204, lng: 73.8567, region: 'Maharashtra' },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, region: 'Gujarat' },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873, region: 'Rajasthan' },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462, region: 'Uttar Pradesh' },
    { name: 'Kanpur', lat: 26.4499, lng: 80.3319, region: 'Uttar Pradesh' },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882, region: 'Maharashtra' },
    { name: 'Indore', lat: 22.7196, lng: 75.8577, region: 'Madhya Pradesh' },
    { name: 'Thane', lat: 19.2183, lng: 72.9781, region: 'Maharashtra' },
    { name: 'Bhopal', lat: 23.2599, lng: 77.4126, region: 'Madhya Pradesh' },
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, region: 'Andhra Pradesh' },
    { name: 'Pimpri-Chinchwad', lat: 18.6298, lng: 73.7997, region: 'Maharashtra' },
    { name: 'Patna', lat: 25.5941, lng: 85.1376, region: 'Bihar' },
    { name: 'Vadodara', lat: 22.3072, lng: 73.1812, region: 'Gujarat' },
    { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538, region: 'Uttar Pradesh' }
];

// Water source types
const waterSources = [
    'Groundwater Well', 'Municipal Supply', 'River Water', 'Lake Water',
    'Tube Well', 'Hand Pump', 'Bore Well', 'Surface Water',
    'Spring Water', 'Canal Water', 'Reservoir Water', 'Tank Water'
];

// Realistic metal concentration ranges (in mg/L)
const metalRanges = {
    lead: { min: 0.001, max: 0.05, safe: 0.01 },
    cadmium: { min: 0.0001, max: 0.015, safe: 0.003 },
    chromium: { min: 0.001, max: 0.2, safe: 0.05 },
    arsenic: { min: 0.0005, max: 0.08, safe: 0.01 },
    mercury: { min: 0.0001, max: 0.03, safe: 0.006 }
};

// Generate random value within range with bias towards safe levels
function generateMetalConcentration(metal) {
    const range = metalRanges[metal];
    const random = Math.random();
    
    // 70% chance of being within safe levels
    if (random < 0.7) {
        return Math.random() * range.safe;
    } else {
        // 30% chance of being higher (contaminated areas)
        return range.safe + (Math.random() * (range.max - range.safe));
    }
}

// Generate random date within last 2 years
function generateRandomDate() {
    const start = new Date('2022-01-01');
    const end = new Date();
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime).toISOString().split('T')[0];
}

// Generate sample ID
function generateSampleId(index) {
    const prefixes = ['WQ', 'AQ', 'GW', 'SW', 'TW', 'MW'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const year = new Date().getFullYear();
    return `${prefix}-${year}-${String(index + 1).padStart(4, '0')}`;
}

// Generate location name with correct coordinates
function generateLocation(cityData, index) {
    const source = waterSources[Math.floor(Math.random() * waterSources.length)];
    
    // Add some variation to coordinates (±0.05 degrees ~ 5.5km)
    const latVariation = (Math.random() - 0.5) * 0.1;
    const lngVariation = (Math.random() - 0.5) * 0.1;
    
    return {
        name: `${cityData.name} - ${source} #${(index % 20) + 1}`,
        coordinates: {
            lat: cityData.lat + latVariation,
            lng: cityData.lng + lngVariation
        }
    };
}

// Generate demo sample data with correct coordinates
function generateDemoSamples() {
    const samples = [];
    
    for (let i = 0; i < TOTAL_SAMPLES; i++) {
        const cityData = indianLocations[i % indianLocations.length];
        const location = generateLocation(cityData, i);
        
        const sample = {
            sampleId: generateSampleId(i),
            date: generateRandomDate(),
            depth: Math.random() < 0.3 ? Math.floor(Math.random() * 100) + 10 : 0,
            location: location.name,
            latitude: location.coordinates.lat,
            longitude: location.coordinates.lng,
            metals: {
                lead: parseFloat(generateMetalConcentration('lead').toFixed(6)),
                cadmium: parseFloat(generateMetalConcentration('cadmium').toFixed(6)),
                chromium: parseFloat(generateMetalConcentration('chromium').toFixed(6)),
                arsenic: parseFloat(generateMetalConcentration('arsenic').toFixed(6)),
                mercury: parseFloat(generateMetalConcentration('mercury').toFixed(6))
            }
        };
        
        samples.push(sample);
    }
    
    return samples;
}

// Clear existing data
async function clearExistingData() {
    try {
        console.log('🗑️ Attempting to clear existing data...');
        const response = await fetch(`${API_BASE_URL}/api/readings`);
        if (response.ok) {
            const data = await response.json();
            const readings = data.data || [];
            console.log(`📊 Found ${readings.length} existing readings in database`);
            
            if (readings.length > 0) {
                console.log('⚠️ Note: Manual database clearing may be required');
                console.log('   The API doesn\'t provide a bulk delete endpoint');
            }
        }
    } catch (error) {
        console.log('ℹ️ Could not check existing data, proceeding with fresh insertion');
    }
}

// Insert sample data using the API
async function insertSampleData(sample) {
    try {
        const response = await fetch(`${API_BASE_URL}/add-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sample)
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Inserted: ${sample.sampleId} - ${sample.location} (${sample.latitude.toFixed(4)}, ${sample.longitude.toFixed(4)})`);
            return { success: true, data: result };
        } else {
            const error = await response.json();
            console.error(`❌ Failed to insert ${sample.sampleId}:`, error.message);
            return { success: false, error: error.message };
        }
    } catch (error) {
        console.error(`❌ Network error for ${sample.sampleId}:`, error.message);
        return { success: false, error: error.message };
    }
}

// Main clearing and reseeding function
async function clearAndReseedData() {
    console.log('🔄 Starting database clear and reseed process...');
    console.log(`📍 Generating ${TOTAL_SAMPLES} water quality samples with CORRECT coordinates`);
    console.log(`🌍 Covering ${indianLocations.length} major Indian cities\n`);
    
    // Step 1: Clear existing data (informational only)
    await clearExistingData();
    
    console.log('\n🌱 Starting fresh data seeding with correct coordinates...\n');
    
    // Step 2: Generate new samples
    const samples = generateDemoSamples();
    let successCount = 0;
    let failureCount = 0;
    
    // Step 3: Insert samples with coordinates
    for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        
        console.log(`[${i + 1}/${TOTAL_SAMPLES}] Processing: ${sample.sampleId}`);
        console.log(`📍 Location: ${sample.location}`);
        console.log(`🗺️ Coordinates: ${sample.latitude.toFixed(4)}, ${sample.longitude.toFixed(4)}`);
        console.log(`📅 Date: ${sample.date}`);
        console.log(`🧪 Metals: Pb=${sample.metals.lead}, Cd=${sample.metals.cadmium}, Cr=${sample.metals.chromium}, As=${sample.metals.arsenic}, Hg=${sample.metals.mercury}\n`);
        
        const result = await insertSampleData(sample);
        
        if (result.success) {
            successCount++;
        } else {
            failureCount++;
        }
        
        // Add delay between requests (300ms)
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('\n🎉 Corrected demo data seeding completed!');
    console.log(`✅ Successfully inserted: ${successCount} samples with correct coordinates`);
    console.log(`❌ Failed to insert: ${failureCount} samples`);
    
    // Save corrected summary
    const summary = {
        total_samples: TOTAL_SAMPLES,
        successful_inserts: successCount,
        failed_inserts: failureCount,
        cities_covered: indianLocations.length,
        completion_time: new Date().toISOString(),
        coordinates_correction: 'Applied correct latitude/longitude mapping',
        sample_data_overview: {
            date_range: '2022-01-01 to present',
            metal_parameters: Object.keys(metalRanges),
            water_sources: waterSources,
            geographic_coverage: 'Major Indian cities with accurate coordinates',
            coordinate_variation: '±0.05 degrees (~5.5km radius) from city centers'
        }
    };
    
    fs.writeFileSync('corrected-demo-data-summary.json', JSON.stringify(summary, null, 2));
    console.log('\n📄 Corrected summary saved to corrected-demo-data-summary.json');
    
    if (successCount > 0) {
        console.log('\n🗺️ SUCCESS! Your interactive map now has correctly positioned data!');
        console.log('🔗 Open map.html in your browser to see:');
        console.log('   • Markers at correct geographic locations');
        console.log('   • Accurate distance-based radius queries');
        console.log('   • Proper city-to-coordinate mapping');
        console.log('   • Click anywhere on the map for water hardness statistics!');
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⚡ Process interrupted by user');
    process.exit(0);
});

// Run the clearing and reseeding
if (process.argv[1] === __filename) {
    clearAndReseedData().catch(error => {
        console.error('💥 Fatal error during clear and reseed:', error);
        process.exit(1);
    });
}

export { clearAndReseedData };
