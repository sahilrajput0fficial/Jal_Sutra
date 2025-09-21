import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/water_quality';

// Connect to MongoDB
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Water Quality Reading Schema
const readingSchema = new mongoose.Schema({
  sample_id: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  depth: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  lead: {
    type: Number,
    default: 0,
    min: 0
  },
  cadmium: {
    type: Number,
    default: 0,
    min: 0
  },
  chromium: {
    type: Number,
    default: 0,
    min: 0
  },
  arsenic: {
    type: Number,
    default: 0,
    min: 0
  },
  mercury: {
    type: Number,
    default: 0,
    min: 0
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Reading = mongoose.models.Reading || mongoose.model('Reading', readingSchema);

// Initialize default admin user
export async function initializeAdmin() {
  try {
    await connectDB();
    
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      const adminUser = new User({
        username: 'admin',
        password_hash: hashedPassword,
        email: 'admin@jalsutra.com',
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Default admin user created (username: admin, password: admin123)');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  }
}

// User operations
export const userOperations = {
  async create(username, password_hash, email = null, role = 'user') {
    await connectDB();
    const user = new User({ username, password_hash, email, role });
    return await user.save();
  },
  
  async findByUsername(username) {
    await connectDB();
    return await User.findOne({ username });
  },
  
  async findById(id) {
    await connectDB();
    return await User.findById(id);
  }
};

// Reading operations
export const readingOperations = {
  async create(sample_id, date, depth, location, lead, cadmium, chromium, arsenic, mercury, user_id = null) {
    await connectDB();
    const reading = new Reading({
      sample_id, date, depth, location, lead, cadmium, chromium, arsenic, mercury, user_id
    });
    return await reading.save();
  },
  
  async findAll() {
    await connectDB();
    return await Reading.find().sort({ createdAt: -1 });
  },
  
  async findById(id) {
    await connectDB();
    return await Reading.findById(id);
  },
  
  async update(id, updateData) {
    await connectDB();
    return await Reading.findByIdAndUpdate(id, updateData, { new: true });
  },
  
  async delete(id) {
    await connectDB();
    return await Reading.findByIdAndDelete(id);
  },
  
  async getAnalytics() {
    await connectDB();
    
    const analytics = await Reading.aggregate([
      {
        $group: {
          _id: null,
          total_samples: { $sum: 1 },
          avg_lead: { $avg: '$lead' },
          avg_cadmium: { $avg: '$cadmium' },
          avg_chromium: { $avg: '$chromium' },
          avg_arsenic: { $avg: '$arsenic' },
          avg_mercury: { $avg: '$mercury' },
          max_lead: { $max: '$lead' },
          max_cadmium: { $max: '$cadmium' },
          max_chromium: { $max: '$chromium' },
          max_arsenic: { $max: '$arsenic' },
          max_mercury: { $max: '$mercury' },
          min_lead: { $min: '$lead' },
          min_cadmium: { $min: '$cadmium' },
          min_chromium: { $min: '$chromium' },
          min_arsenic: { $min: '$arsenic' },
          min_mercury: { $min: '$mercury' }
        }
      }
    ]);
    
    return analytics[0] || {
      total_samples: 0,
      avg_lead: 0, avg_cadmium: 0, avg_chromium: 0, avg_arsenic: 0, avg_mercury: 0,
      max_lead: 0, max_cadmium: 0, max_chromium: 0, max_arsenic: 0, max_mercury: 0,
      min_lead: 0, min_cadmium: 0, min_chromium: 0, min_arsenic: 0, min_mercury: 0
    };
  }
};
