# JAL Sutra Backend - Vercel Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account**: Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Vercel Account**: Sign up at [Vercel](https://vercel.com)
3. **GitHub Repository**: Push your code to GitHub

## Step 1: Set up MongoDB Atlas

1. **Create a Cluster**:
   - Login to MongoDB Atlas
   - Create a new cluster (free tier is fine)
   - Wait for cluster to be created

2. **Create Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Create username/password (save these!)
   - Grant "Read and write to any database" permissions

3. **Configure Network Access**:
   - Go to "Network Access" 
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)

4. **Get Connection String**:
   - Go to "Clusters" 
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://user_sahil_ig:Sahil123@igniters.bad8d6i.mongodb.net/?retryWrites=true&w=majority&appName=igniters`)
   mongodb+srv://user_sahil_ig:Sahil123@igniters.bad8d6i.mongodb.net/?retryWrites=true&w=majority&appName=igniters

## Step 2: Configure Environment Variables

Before deploying, you'll need to set up environment variables in Vercel:

1. **JWT_SECRET**: A strong secret key for JWT tokens
2. **MONGODB_URI**: Your MongoDB Atlas connection string

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   - Select "Link to existing project" or create new
   - Follow prompts to configure deployment

3. **Set Environment Variables**:
   ```bash
   vercel env add JWT_SECRET
   vercel env add MONGODB_URI
   ```

### Option B: Deploy via Vercel Dashboard

1. **Import Project**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**:
   - In project settings → Environment Variables
   - Add:
     - `JWT_SECRET`: `your-super-secret-jwt-key-here`
     - `MONGODB_URI`: `your-mongodb-atlas-connection-string`

3. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

## Step 4: Update Frontend

After deployment, update your frontend to point to the new Vercel URL:

1. **Find your Vercel URL** (e.g., `https://your-app.vercel.app`)

2. **Update script.js**:
   Replace `http://localhost:5050` with your Vercel URL:
   ```javascript
   const response = await fetch('https://your-app.vercel.app/login', {
       method: 'POST',
       // ... rest of the code
   });
   ```

## API Endpoints (Production)

Your deployed API will have these endpoints:

- `GET https://your-app.vercel.app/api` - API info
- `POST https://your-app.vercel.app/login` - Login (legacy)
- `POST https://your-app.vercel.app/add-data` - Submit data (legacy)
- `POST https://your-app.vercel.app/api/login` - Login
- `POST https://your-app.vercel.app/api/register` - Register
- `POST https://your-app.vercel.app/api/add-data` - Submit data
- `GET https://your-app.vercel.app/api/readings` - Get all readings
- `GET https://your-app.vercel.app/api/analytics` - Get analytics

## Default Admin Account

- **Username**: `admin`
- **Password**: `admin123`

## Testing

Test your deployed API:

```bash
curl https://your-app.vercel.app/api
curl -X POST https://your-app.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Troubleshooting

1. **Database Connection Issues**: 
   - Check MongoDB Atlas IP whitelist
   - Verify connection string format
   - Ensure database user has proper permissions

2. **Environment Variables**:
   - Verify variables are set in Vercel dashboard
   - Redeploy after adding environment variables

3. **Function Timeout**:
   - Check Vercel function logs
   - Ensure MongoDB operations complete within 10 seconds

## Monitoring

- **Vercel Dashboard**: Monitor deployments and function logs
- **MongoDB Atlas**: Monitor database performance and connections

## Security Notes

- Never commit sensitive environment variables to Git
- Use strong JWT secrets in production
- Consider implementing rate limiting for production use
- Regularly rotate database credentials
