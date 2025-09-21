# 🚀 JAL Sutra Backend - Ready for Vercel Deployment

## ✅ What's Been Completed

1. **✅ Vercel CLI Installed**: Using `npx vercel`
2. **✅ MongoDB Integration**: Replaced SQLite with MongoDB Atlas
3. **✅ Serverless Architecture**: Created `/api/index.js` for Vercel
4. **✅ Configuration Files**: `vercel.json` ready for deployment
5. **✅ Environment Variables**: Template ready for production

## 📁 New File Structure

```
backend/
├── api/
│   └── index.js          # Main serverless function
├── auth.js               # Authentication (updated for MongoDB)
├── database-mongo.js     # MongoDB connection & models
├── vercel.json           # Vercel deployment config
├── .env                  # Environment variables (template)
├── package.json          # Updated dependencies
├── DEPLOYMENT.md         # Detailed deployment guide
└── VERCEL_SETUP.md       # This file
```

## 🎯 Next Steps to Deploy

### 1. Set Up MongoDB Atlas (5 minutes)

1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create Cluster**: Free tier is sufficient
3. **Create Database User**: Save username/password
4. **Whitelist All IPs**: Set to `0.0.0.0/0`
5. **Get Connection String**: Copy the MongoDB URI

### 2. Deploy to Vercel

#### Option A: Quick Deploy (Recommended)

```bash
# Login to Vercel
npx vercel login

# Deploy (follow prompts)
npx vercel

# Set environment variables
npx vercel env add JWT_SECRET
npx vercel env add MONGODB_URI
```

#### Option B: GitHub + Vercel Dashboard

1. Push code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add environment variables in Settings

### 3. Environment Variables to Set

| Variable | Value | Example |
|----------|-------|---------|
| `JWT_SECRET` | Strong secret key | `your-super-secret-jwt-key-2024` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/water_quality` |

### 4. Update Frontend

After deployment, update your `script.js`:

```javascript
// Replace localhost URLs with your Vercel URL
const response = await fetch('https://your-project.vercel.app/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ username, password })
});
```

## 🔗 API Endpoints (After Deployment)

Your API will be available at: `https://your-project.vercel.app`

### Legacy Endpoints (Backward Compatible)
- `POST /login` - User login
- `POST /add-data` - Submit water quality data

### New API Endpoints  
- `GET /api` - API information
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/add-data` - Submit water quality data
- `GET /api/readings` - Get all readings
- `GET /api/analytics` - Get analytics & calculations

## 🧪 Test Your Deployment

```bash
# Test API health
curl https://your-project.vercel.app/api

# Test login
curl -X POST https://your-project.vercel.app/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 🔐 Default Admin Account

- **Username**: `admin`
- **Password**: `admin123`

## 📋 Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write permissions  
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string copied
- [ ] Logged into Vercel (`npx vercel login`)
- [ ] Project deployed (`npx vercel`)
- [ ] Environment variables set
- [ ] Frontend updated with new API URL
- [ ] Tested API endpoints

## 🆘 Troubleshooting

**Database connection issues?**
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure database user has proper permissions

**Vercel deployment failing?**
- Check function logs in Vercel dashboard
- Verify environment variables are set
- Ensure all dependencies are in package.json

**Frontend not connecting?**
- Update script.js with correct Vercel URL
- Check CORS configuration
- Verify API endpoints are responding

## 📚 Documentation

- **DEPLOYMENT.md**: Complete deployment guide
- **README.md**: API documentation
- **Original backend**: Still in root directory (for reference)

---

**Ready to deploy?** Run `npx vercel login` then `npx vercel` to get started! 🚀
