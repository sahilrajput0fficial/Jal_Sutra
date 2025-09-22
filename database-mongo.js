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
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
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

// Scientist Profile Schema
const scientistProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, default: 'Lead Scientist' },
  email: { type: String, default: '' },
  organization: { type: String, default: '' },
  title: { type: String, default: '' },
  bio: { type: String, default: '' },
  expertise: { type: [String], default: [] },
  phone: { type: String, default: '' },
  website: { type: String, default: '' },
  location: { type: String, default: '' }
}, { timestamps: true });

// Create models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Reading = mongoose.models.Reading || mongoose.model('Reading', readingSchema);
export const ScientistProfile = mongoose.models.ScientistProfile || mongoose.model('ScientistProfile', scientistProfileSchema);

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

    // Create demo scientist users if not present
    const demoUsers = [
      { username: 'scientist1', email: 'scientist1@jalsutra.com' },
      { username: 'scientist2', email: 'scientist2@jalsutra.com' },
      { username: 'scientist3', email: 'scientist3@jalsutra.com' }
    ];
    for (const du of demoUsers) {
      const exists = await User.findOne({ username: du.username });
      if (!exists) {
        const pass = bcrypt.hashSync('demo123', 10);
        const user = new User({ username: du.username, password_hash: pass, email: du.email, role: 'user' });
        await user.save();
        console.log(`Demo scientist created (${du.username} / demo123)`);
      }
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

// Scientist profile operations
export const scientistProfileOperations = {
  async getOrCreateDefaultForUser(userId, defaults = {}) {
    await connectDB();
    let doc = await ScientistProfile.findOne({ user_id: userId });
    if (!doc) {
      doc = new ScientistProfile({
        user_id: userId,
        name: defaults.name || 'Lead Scientist',
        email: defaults.email || '',
        title: defaults.title || 'Environmental Scientist',
        bio: defaults.bio || 'Researching water quality and heavy metal contamination.',
        expertise: defaults.expertise || ['Water Quality', 'Heavy Metals', 'Environmental Monitoring'],
        organization: defaults.organization || '',
        website: defaults.website || '',
        phone: defaults.phone || '',
        location: defaults.location || ''
      });
      await doc.save();
    }
    return doc;
  },
  async updateForUser(userId, updateData) {
    await connectDB();
    const doc = await ScientistProfile.findOneAndUpdate({ user_id: userId }, { ...updateData, user_id: userId }, { new: true, upsert: true });
    return doc;
  }
};

// Reading operations
export const readingOperations = {
  async create(sample_id, date, depth, location, latitude, longitude, lead, cadmium, chromium, arsenic, mercury, user_id = null) {
    await connectDB();
    const reading = new Reading({
      sample_id, date, depth, location, latitude, longitude, lead, cadmium, chromium, arsenic, mercury, user_id
    });
    return await reading.save();
  },
  
  async bulkCreate(rows) {
    await connectDB();
    const result = await Reading.insertMany(rows, { ordered: false });
    return { insertedCount: result.length, docs: result };
  },
  
  async findAll() {
    await connectDB();
    return await Reading.find().sort({ createdAt: -1 });
  },
  
  async findById(id) {
    await connectDB();
    return await Reading.findById(id);
  },
  
  async findByUserId(userId) {
    await connectDB();
    return await Reading.find({ user_id: userId }).sort({ createdAt: -1 });
  },
  
  async countByDateForUser(userId) {
    await connectDB();
    const result = await Reading.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$date',
          count: { $sum: 1 }
        }
      },
      { $project: { _id: 0, date: '$_id', count: 1 } },
      { $sort: { date: 1 } }
    ]);
    return result;
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
