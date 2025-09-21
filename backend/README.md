# JAL Sutra Backend API

A Node.js backend server for the JAL Sutra Water Quality Monitoring system.

## Features

- 🔐 **Authentication**: JWT-based user authentication
- 💧 **Water Quality Data**: CRUD operations for water quality readings
- 📊 **Analytics**: Water quality index calculations (HPI, HEI, Cd, mCd)
- 🗄️ **SQLite Database**: Lightweight database for data persistence
- 🔒 **CORS Support**: Configured for frontend integration

## Quick Start

```bash
npm install
npm start
```

The server will run on `http://localhost:5050`

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register` - User registration

### Water Quality Data
- `POST /add-data` - Submit new water quality sample
- `GET /api/readings` - Get all readings
- `GET /api/readings/:id` - Get specific reading
- `PUT /api/readings/:id` - Update reading (requires auth)
- `DELETE /api/readings/:id` - Delete reading (requires auth)
- `GET /api/analytics` - Get analytics and calculated indices

### System
- `GET /health` - Health check
- `GET /` - Serve frontend

## Default Admin Account

- **Username**: `admin`
- **Password**: `admin123`

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `password_hash` - Hashed password
- `email` - User email
- `role` - User role (admin/user)
- `created_at` - Timestamp

### Readings Table
- `id` - Primary key
- `sample_id` - Sample identifier
- `date` - Sample date
- `depth` - Water depth
- `location` - Sample location
- `lead`, `cadmium`, `chromium`, `arsenic`, `mercury` - Metal concentrations
- `user_id` - Foreign key to users
- `created_at` - Timestamp

## Water Quality Indices

The system calculates several water quality indices:

- **HPI**: Heavy Metal Pollution Index
- **HEI**: Heavy Metal Evaluation Index
- **Cd**: Contamination Degree
- **mCd**: Modified Contamination Degree

## Environment Variables

Create a `.env` file:

```env
PORT=5050
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

## Development

```bash
npm run dev  # Run with auto-restart on file changes
```

## Technologies Used

- **Express.js** - Web framework
- **SQLite** (better-sqlite3) - Database
- **JWT** - Authentication tokens  
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests
- **Morgan** - HTTP request logging
- **dotenv** - Environment configuration
