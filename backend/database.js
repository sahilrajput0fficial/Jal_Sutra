import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('water_quality.db');

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Create users table
const createUsersTable = db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create water quality readings table
const createReadingsTable = db.prepare(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sample_id TEXT NOT NULL,
    date TEXT NOT NULL,
    depth REAL DEFAULT 0,
    location TEXT NOT NULL,
    lead REAL DEFAULT 0,
    cadmium REAL DEFAULT 0,
    chromium REAL DEFAULT 0,
    arsenic REAL DEFAULT 0,
    mercury REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`);

// Initialize tables
createUsersTable.run();
createReadingsTable.run();

// Create default admin user if not exists
const checkAdmin = db.prepare('SELECT * FROM users WHERE username = ?');
const adminExists = checkAdmin.get('admin');

if (!adminExists) {
  const createUser = db.prepare(`
    INSERT INTO users (username, password_hash, email, role)
    VALUES (?, ?, ?, ?)
  `);
  
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  createUser.run('admin', hashedPassword, 'admin@jalsutra.com', 'admin');
  console.log('Default admin user created (username: admin, password: admin123)');
}

// Prepared statements for common operations
export const userQueries = {
  create: db.prepare(`
    INSERT INTO users (username, password_hash, email, role)
    VALUES (?, ?, ?, ?)
  `),
  findByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  findById: db.prepare('SELECT * FROM users WHERE id = ?'),
};

export const readingQueries = {
  create: db.prepare(`
    INSERT INTO readings (sample_id, date, depth, location, lead, cadmium, chromium, arsenic, mercury, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  findAll: db.prepare('SELECT * FROM readings ORDER BY created_at DESC'),
  findById: db.prepare('SELECT * FROM readings WHERE id = ?'),
  update: db.prepare(`
    UPDATE readings 
    SET sample_id = ?, date = ?, depth = ?, location = ?, lead = ?, cadmium = ?, chromium = ?, arsenic = ?, mercury = ?
    WHERE id = ?
  `),
  delete: db.prepare('DELETE FROM readings WHERE id = ?'),
  getAnalytics: db.prepare(`
    SELECT 
      COUNT(*) as total_samples,
      AVG(lead) as avg_lead,
      AVG(cadmium) as avg_cadmium, 
      AVG(chromium) as avg_chromium,
      AVG(arsenic) as avg_arsenic,
      AVG(mercury) as avg_mercury,
      MAX(lead) as max_lead,
      MAX(cadmium) as max_cadmium,
      MAX(chromium) as max_chromium,
      MAX(arsenic) as max_arsenic,
      MAX(mercury) as max_mercury,
      MIN(lead) as min_lead,
      MIN(cadmium) as min_cadmium,
      MIN(chromium) as min_chromium,
      MIN(arsenic) as min_arsenic,
      MIN(mercury) as min_mercury
    FROM readings
  `)
};

export default db;
