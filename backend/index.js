import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { initializeAdmin, readingOperations } from './database-mongo.js';
import { loginUser, registerUser, authenticateToken } from './auth.js';

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
    const { sampleId, date, depth, location, metals } = req.body;
    
    if (!sampleId || !date || !location || !metals) {
      return res.status(400).json({ 
        message: 'Missing required fields: sampleId, date, location, and metals are required' 
      });
    }

    // Extract metal concentrations
    const { lead, cadmium, chromium, arsenic, mercury } = metals;
    
    // Insert reading into database
    const newReading = await readingOperations.create(
      sampleId,
      date,
      depth || 0,
      location,
      lead || 0,
      cadmium || 0,
      chromium || 0,
      arsenic || 0,
      mercury || 0,
      null // user_id - set to null for now
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
    const { sampleId, date, depth, location, metals } = req.body;
    
    if (!sampleId || !date || !location || !metals) {
      return res.status(400).json({ 
        message: 'Missing required fields: sampleId, date, location, and metals are required' 
      });
    }

    // Extract metal concentrations
    const { lead, cadmium, chromium, arsenic, mercury } = metals;
    
    // Insert reading into database
    const newReading = await readingOperations.create(
      sampleId,
      date,
      depth || 0,
      location,
      lead || 0,
      cadmium || 0,
      chromium || 0,
      arsenic || 0,
      mercury || 0,
      null // user_id - set to null for now
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
    const { sampleId, date, depth, location, metals } = req.body;
    
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

export default app;
