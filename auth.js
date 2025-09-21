import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { userOperations } from './database-mongo.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id || user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Verify JWT token middleware
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Login function
export async function loginUser(username, password) {
  try {
    const user = await userOperations.findByUsername(username);
    
    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }

    const isValidPassword = bcrypt.compareSync(password, user.password_hash);
    
    if (!isValidPassword) {
      return { success: false, message: 'Invalid username or password' };
    }

    const token = generateToken(user);
    
    return {
      success: true,
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Login failed' };
  }
}

// Register function
export async function registerUser(username, password, email = null) {
  try {
    // Check if user already exists
    const existingUser = await userOperations.findByUsername(username);
    if (existingUser) {
      return { success: false, message: 'Username already exists' };
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Create user
    const newUser = await userOperations.create(username, hashedPassword, email, 'user');
    const token = generateToken(newUser);
    
    return {
      success: true,
      user: {
        id: newUser._id || newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      token
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed' };
  }
}
