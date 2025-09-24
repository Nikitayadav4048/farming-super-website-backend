const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const { google } = require('googleapis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
require('dotenv').config();

const User = require('./models/User');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');



const app = express();

// CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `http://localhost:${process.env.PORT || 3000}/api/auth/google/callback`
);

// Static files
app.use('/uploads', express.static('uploads'));
app.use(express.static('.'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farming-website')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// OAuth login page
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/oauth-login.html');
});

// Home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/oauth-login.html');
});

// Simple login (backup)
app.get('/simple', (req, res) => {
  res.sendFile(__dirname + '/simple-login.html');
});

// Privacy Policy
app.get('/privacy-policy', (req, res) => {
  res.sendFile(__dirname + '/privacy-policy.html');
});

// Terms of Service
app.get('/terms-of-service', (req, res) => {
  res.sendFile(__dirname + '/terms-of-service.html');
});

// Helper functions
const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

const formatDataToSend = (user) => {
  const access_token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'farming-secret-key',
    { expiresIn: '7d' }
  );

  return {
    access_token,
    profile_img: user.profilePicture,
    username: user.name,
    fullname: user.name,
    email: user.email
  };
};

const generateUsername = async (email) => {
  let base = email.split('@')[0];
  let exists = await User.exists({ name: base });

  while (exists) {
    base = `${email.split('@')[0]}_${nanoid(5)}`;
    exists = await User.exists({ name: base });
  }

  return base;
};

// Google OAuth Routes
app.get('/api/auth/google', (req, res) => {
  const scopes = ['profile', 'email'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });
  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    
    let user = await User.findOne({ email: data.email });
    
    if (!user) {
      user = new User({
        name: data.name,
        email: data.email,
        password: 'google-auth',
        profilePicture: data.picture,
        isGoogleAuth: true,
        role: 'user'
      });
      await user.save();
    }
    
    const token = user.generateToken();
    res.redirect(`http://127.0.0.1:5500/dashboard.html?token=${token}&user=${encodeURIComponent(JSON.stringify({
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture
    }))}`);  
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect('http://127.0.0.1:5500/?error=oauth_failed');
  }
});

// Auth status check
app.get('/api/auth/status', (req, res) => {
  res.json({
    authentication: 'email/password + Google OAuth',
    endpoints: {
      register: '/api/auth/register',
      login: '/api/auth/login',
      googleAuth: '/api/auth/google-auth'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET || 'farming-secret-key', async (err, decoded) => {
    if (err) return res.sendStatus(403);
    
    try {
      req.user = await User.findById(decoded.id);
      next();
    } catch (error) {
      return res.sendStatus(403);
    }
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Protected routes
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Admin only route
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});