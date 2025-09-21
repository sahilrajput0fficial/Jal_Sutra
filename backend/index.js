import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import './database.js'; // Initialize database
import { loginUser, registerUser, authenticateToken } from './auth.js';
import { readingQueries } from './database.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(morgan('combined'));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://', 'null'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Serve frontend files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../home.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication Routes
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

app.post('/register', async (req, res) => {
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
    const result = readingQueries.create.run(
      sampleId,
      date,
      depth || 0,
      location,
      lead || 0,
      cadmium || 0,
      chromium || 0,
      arsenic || 0,
      mercury || 0,
      null // user_id - set to null for now, can be updated with authentication
    );
    
    const newReading = readingQueries.findById.get(result.lastInsertRowid);
    
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
app.get('/api/readings', (req, res) => {
  try {
    const readings = readingQueries.findAll.all();
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
app.get('/api/readings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const reading = readingQueries.findById.get(id);
    
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
app.put('/api/readings/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { sampleId, date, depth, location, metals } = req.body;
    
    const existingReading = readingQueries.findById.get(id);
    if (!existingReading) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    
    const { lead, cadmium, chromium, arsenic, mercury } = metals;
    
    readingQueries.update.run(
      sampleId,
      date,
      depth || 0,
      location,
      lead || 0,
      cadmium || 0,
      chromium || 0,
      arsenic || 0,
      mercury || 0,
      id
    );
    
    const updatedReading = readingQueries.findById.get(id);
    
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
app.delete('/api/readings/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    const existingReading = readingQueries.findById.get(id);
    if (!existingReading) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    
    readingQueries.delete.run(id);
    
    res.json({ message: 'Reading deleted successfully' });
  } catch (error) {
    console.error('Error deleting reading:', error);
    res.status(500).json({ message: 'Failed to delete reading' });
  }
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
  try {
    const analytics = readingQueries.getAnalytics.get();
    
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 JAL Sutra Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Frontend available at http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
