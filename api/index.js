import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import { initializeAdmin, readingOperations, scientistProfileOperations } from '../database-mongo.js';
import { loginUser, registerUser, authenticateToken } from '../auth.js';

// Load environment variables
dotenv.config();

const app = express();

// Initialize database
initializeAdmin();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static frontend files during local development
app.use(express.static('.'));

// Health check
app.get('/api', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'JAL Sutra Backend API',
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication Routes
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    res.json({ message: 'User info', user: req.user });
  } catch (e) {
    res.status(500).json({ message: 'Failed to get user info' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const result = await loginUser(username, password);
    
    if (result.success) {
      res.json({
        message: 'Login successful',
        user: result.user,
        token: result.token
      });
    } else {
      res.status(401).json({ message: result.message });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// For backward compatibility with frontend
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const result = await loginUser(username, password);
    
    if (result.success) {
      res.json({
        message: 'Login successful',
        user: result.user,
        token: result.token
      });
    } else {
      res.status(401).json({ message: result.message });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const result = await registerUser(username, password, email);
    
    if (result.success) {
      res.status(201).json({
        message: 'Registration successful',
        user: result.user,
        token: result.token
      });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Water Quality Data Routes
app.post('/api/add-data', async (req, res) => {
  try {
    const { sampleId, date, depth, location, latitude, longitude, metals } = req.body;
    
    if (!sampleId || !date || !location || !metals || latitude === undefined || !Number.isFinite(parseFloat(latitude)) || longitude === undefined || !Number.isFinite(parseFloat(longitude))) {
      return res.status(400).json({ 
        message: 'Missing required fields: sampleId, date, location, latitude, longitude, and metals are required' 
      });
    }

    // Extract metal concentrations
    const { lead, cadmium, chromium, arsenic, mercury } = metals;

    // Try to associate reading with the authenticated user if Authorization header is present
    let userId = null;
    try {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || '50edf28add8d3bd562a4f4814f4fc441';
        const decoded = jwt.verify(token, secret);
        userId = decoded?.id || null;
      }
    } catch (e) {
      // ignore token errors for this unprotected route
    }
    
    // Insert reading into database
    const newReading = await readingOperations.create(
      sampleId,
      date,
      depth || 0,
      location,
      parseFloat(latitude),
      parseFloat(longitude),
      lead || 0,
      cadmium || 0,
      chromium || 0,
      arsenic || 0,
      mercury || 0,
      userId
    );
    
    res.status(201).json({
      message: 'Sample data submitted successfully',
      data: newReading
    });
  } catch (error) {
    console.error('Data submission error:', error);
    res.status(500).json({ message: 'Failed to submit sample data' });
  }
});

// For backward compatibility with frontend
app.post('/add-data', async (req, res) => {
  try {
    const { sampleId, date, depth, location, latitude, longitude, metals } = req.body;
    
    if (!sampleId || !date || !location || !metals || latitude === undefined || !Number.isFinite(parseFloat(latitude)) || longitude === undefined || !Number.isFinite(parseFloat(longitude))) {
      return res.status(400).json({ 
        message: 'Missing required fields: sampleId, date, location, latitude, longitude, and metals are required' 
      });
    }

    // Extract metal concentrations
    const { lead, cadmium, chromium, arsenic, mercury } = metals;

    // Try to associate reading with the authenticated user if Authorization header is present
    let userId = null;
    try {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || '50edf28add8d3bd562a4f4814f4fc441';
        const decoded = jwt.verify(token, secret);
        userId = decoded?.id || null;
      }
    } catch (e) {
      // ignore token errors for this unprotected route
    }
    
    // Insert reading into database
    const newReading = await readingOperations.create(
      sampleId,
      date,
      depth || 0,
      location,
      parseFloat(latitude),
      parseFloat(longitude),
      lead || 0,
      cadmium || 0,
      chromium || 0,
      arsenic || 0,
      mercury || 0,
      userId
    );
    
    res.status(201).json({
      message: 'Sample data submitted successfully',
      data: newReading
    });
  } catch (error) {
    console.error('Data submission error:', error);
    res.status(500).json({ message: 'Failed to submit sample data' });
  }
});

// Get all readings
app.get('/api/readings', async (req, res) => {
  try {
    const readings = await readingOperations.findAll();
    res.json({
      message: 'Readings retrieved successfully',
      data: readings
    });
  } catch (error) {
    console.error('Error fetching readings:', error);
    res.status(500).json({ message: 'Failed to fetch readings' });
  }
});

// Batch insert readings
app.post('/api/readings/batch', async (req, res) => {
  try {
    const { readings } = req.body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ message: 'readings must be a non-empty array' });
    }

    // Basic validation and normalization
    const normalized = readings.map((r, idx) => {
      const errors = [];
      if (!r.sampleId) errors.push('sampleId');
      if (!r.date) errors.push('date');
      if (!r.location) errors.push('location');
      const lat = r.latitude !== undefined ? parseFloat(r.latitude) : undefined;
      const lng = r.longitude !== undefined ? parseFloat(r.longitude) : undefined;
      if (lat === undefined || Number.isNaN(lat)) errors.push('latitude');
      if (lng === undefined || Number.isNaN(lng)) errors.push('longitude');
      const metals = r.metals || {};
      const lead = parseFloat(metals.lead) || 0;
      const cadmium = parseFloat(metals.cadmium) || 0;
      const chromium = parseFloat(metals.chromium) || 0;
      const arsenic = parseFloat(metals.arsenic) || 0;
      const mercury = parseFloat(metals.mercury) || 0;
      if (errors.length) {
        return { __error: { index: idx, missing: errors } };
      }
      return {
        sample_id: r.sampleId,
        date: r.date,
        depth: parseFloat(r.depth) || 0,
        location: r.location,
        latitude: lat,
        longitude: lng,
        lead,
        cadmium,
        chromium,
        arsenic,
        mercury,
        user_id: null
      };
    });

    const invalid = normalized.filter(n => n.__error);
    if (invalid.length) {
      return res.status(400).json({ message: 'Validation failed for some rows', invalid });
    }

    const result = await readingOperations.bulkCreate(normalized);
    res.status(201).json({ message: `Inserted ${result.insertedCount} readings`, data: result.docs });
  } catch (error) {
    console.error('Batch insert error:', error);
    res.status(500).json({ message: 'Failed to insert readings in batch' });
  }
});

// My readings (authenticated)
app.get('/api/readings/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const readings = await readingOperations.findByUserId(userId);
    res.json({ message: 'My readings retrieved successfully', data: readings });
  } catch (error) {
    console.error('Error fetching my readings:', error);
    res.status(500).json({ message: 'Failed to fetch my readings' });
  }
});

// My readings daily counts (authenticated)
app.get('/api/readings/my/daily', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const counts = await readingOperations.countByDateForUser(userId);
    res.json({ message: 'My daily counts retrieved successfully', data: counts });
  } catch (error) {
    console.error('Error fetching my daily counts:', error);
    res.status(500).json({ message: 'Failed to fetch my daily counts' });
  }
});

// Get specific reading
app.get('/api/readings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reading = await readingOperations.findById(id);
    
    if (!reading) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    
    res.json({
      message: 'Reading retrieved successfully',
      data: reading
    });
  } catch (error) {
    console.error('Error fetching reading:', error);
    res.status(500).json({ message: 'Failed to fetch reading' });
  }
});

// Update reading (protected route)
app.put('/api/readings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { sampleId, date, depth, location, latitude, longitude, metals } = req.body;
    
    const existingReading = await readingOperations.findById(id);
    if (!existingReading) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    
    const { lead, cadmium, chromium, arsenic, mercury } = metals;
    
    const updatedReading = await readingOperations.update(id, {
      sample_id: sampleId,
      date,
      depth: depth || 0,
      location,
      latitude: latitude !== undefined ? parseFloat(latitude) : existingReading.latitude,
      longitude: longitude !== undefined ? parseFloat(longitude) : existingReading.longitude,
      lead: lead || 0,
      cadmium: cadmium || 0,
      chromium: chromium || 0,
      arsenic: arsenic || 0,
      mercury: mercury || 0
    });
    
    res.json({
      message: 'Reading updated successfully',
      data: updatedReading
    });
  } catch (error) {
    console.error('Error updating reading:', error);
    res.status(500).json({ message: 'Failed to update reading' });
  }
});

// Delete reading (protected route)
app.delete('/api/readings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const existingReading = await readingOperations.findById(id);
    if (!existingReading) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    
    await readingOperations.delete(id);
    
    res.json({ message: 'Reading deleted successfully' });
  } catch (error) {
    console.error('Error deleting reading:', error);
    res.status(500).json({ message: 'Failed to delete reading' });
  }
});

// Get readings by location radius
app.get('/api/readings/location', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    const radiusKm = parseFloat(radius) || 1; // Default 1km radius
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    // Get all readings and filter by actual coordinates within radius
    const allReadings = await readingOperations.findAll();
    
    // Helper function to calculate distance between two points (Haversine formula)
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Earth's radius in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in kilometers
    }
    
    // Filter readings within the specified radius
    const nearbyReadings = allReadings.filter(reading => {
      if (!reading.latitude || !reading.longitude) return false;
      const distance = calculateDistance(latitude, longitude, reading.latitude, reading.longitude);
      return distance <= radiusKm;
    });
    
    // Calculate water hardness and quality indices for each nearby reading
    const standards = { 
      lead: 0.01, 
      cadmium: 0.003, 
      chromium: 0.05, 
      arsenic: 0.01, 
      mercury: 0.006 
    };
    
    const enrichedReadings = nearbyReadings.map(reading => {
      const concentrations = {
        lead: reading.lead || 0,
        cadmium: reading.cadmium || 0,
        chromium: reading.chromium || 0,
        arsenic: reading.arsenic || 0,
        mercury: reading.mercury || 0
      };
      
      // Calculate Heavy Metal Pollution Index (HPI)
      let sumWQi = 0, sumW = 0, hei = 0, cd = 0, sumCS = 0;
      const metals = Object.keys(standards);
      
      metals.forEach(metal => {
        const C = concentrations[metal];
        const S = standards[metal];
        const W = 1 / S;
        const Q = (C / S) * 100;
        
        sumWQi += W * Q;
        sumW += W;
        hei += C / S;
        cd += (C / S) - 1;
        sumCS += C / S;
      });
      
      const hpi = sumW > 0 ? sumWQi / sumW : 0;
      const mcd = sumCS / metals.length;
      
      // Calculate water hardness based on metal concentrations
      // Using a simplified formula: sum of major contributors
      const hardness = (concentrations.lead * 10) + 
                      (concentrations.cadmium * 15) + 
                      (concentrations.chromium * 5) + 
                      (concentrations.arsenic * 12) + 
                      (concentrations.mercury * 20);
      
      let hardnessCategory = 'Soft';
      if (hardness > 300) hardnessCategory = 'Very Hard';
      else if (hardness > 180) hardnessCategory = 'Hard';
      else if (hardness > 60) hardnessCategory = 'Moderately Hard';
      
      return {
        ...reading.toObject(),
        water_quality_indices: {
          hpi: hpi,
          hei: hei,
          cd: cd,
          mcd: mcd
        },
        water_hardness: {
          value: hardness,
          category: hardnessCategory,
          unit: 'mg/L CaCO3 equivalent'
        },
        concentrations: concentrations
      };
    });
    
    // enrichedReadings now contains only readings within the specified radius
    
    // Calculate aggregate statistics for the area
    const areaStats = {
      total_samples: enrichedReadings.length,
      avg_hardness: enrichedReadings.reduce((sum, r) => sum + r.water_hardness.value, 0) / enrichedReadings.length || 0,
      hardness_distribution: {
        soft: enrichedReadings.filter(r => r.water_hardness.category === 'Soft').length,
        moderately_hard: enrichedReadings.filter(r => r.water_hardness.category === 'Moderately Hard').length,
        hard: enrichedReadings.filter(r => r.water_hardness.category === 'Hard').length,
        very_hard: enrichedReadings.filter(r => r.water_hardness.category === 'Very Hard').length
      },
      avg_pollution_index: enrichedReadings.reduce((sum, r) => sum + r.water_quality_indices.hpi, 0) / enrichedReadings.length || 0
    };
    
    res.json({
      message: `Found ${enrichedReadings.length} readings within ${radiusKm}km radius`,
      location: { latitude, longitude, radius: radiusKm },
      area_statistics: areaStats,
      readings: enrichedReadings
    });
  } catch (error) {
    console.error('Error fetching location-based readings:', error);
    res.status(500).json({ message: 'Failed to fetch readings for location' });
  }
});

// Scientist profile endpoints (per-user)
app.get('/api/scientist/profile', authenticateToken, async (req, res) => {
  try {
    const defaults = { name: req.user?.username };
    const profile = await scientistProfileOperations.getOrCreateDefaultForUser(req.user.id, defaults);
    res.json({ message: 'Profile retrieved successfully', data: profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

app.put('/api/scientist/profile', authenticateToken, async (req, res) => {
  try {
    const updated = await scientistProfileOperations.updateForUser(req.user.id, req.body || {});
    res.json({ message: 'Profile updated successfully', data: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await readingOperations.getAnalytics();
    
    // Calculate water quality indices for average values
    const standards = { 
      lead: 0.01, 
      cadmium: 0.003, 
      chromium: 0.05, 
      arsenic: 0.01, 
      mercury: 0.006 
    };
    
    const avgConcentrations = {
      lead: analytics.avg_lead || 0,
      cadmium: analytics.avg_cadmium || 0,
      chromium: analytics.avg_chromium || 0,
      arsenic: analytics.avg_arsenic || 0,
      mercury: analytics.avg_mercury || 0
    };
    
    // Calculate HPI (Heavy Metal Pollution Index)
    const metals = Object.keys(standards);
    let sumWQi = 0;
    let sumW = 0;
    let hei = 0;
    let cd = 0;
    let sumCS = 0;
    
    metals.forEach((metal) => {
      const C = avgConcentrations[metal];
      const S = standards[metal];
      const W = 1 / S;
      const Q = (C / S) * 100;
      
      sumWQi += W * Q;
      sumW += W;
      hei += C / S;
      cd += (C / S) - 1;
      sumCS += C / S;
    });
    
    const hpi = sumWQi / sumW;
    const mcd = sumCS / metals.length;
    
    res.json({
      message: 'Analytics retrieved successfully',
      data: {
        ...analytics,
        calculated_indices: {
          hpi: hpi,
          hei: hei,
          cd: cd,
          mcd: mcd,
          avg_concentrations: avgConcentrations
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start local server only when not running on Vercel/production
const shouldListen = !process.env.VERCEL && process.env.NODE_ENV !== 'production';
if (shouldListen) {
  const port = process.env.PORT || 5050;
  app.listen(port, () => {
    console.log(`JAL Sutra server running on http://localhost:${port}`);
  });
}

export default app;
