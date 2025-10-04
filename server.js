const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const { google } = require('googleapis');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const User = require('./models/User');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const otpRoutes = require('./routes/otp');
const emailOtpRoutes = require('./routes/email-otp');
const weatherRoutes = require('./routes/weather');
const contactRoutes = require('./routes/contact');
const roleBasedRoutes = require('./routes/role-based');

const FRONTEND_BASE_URL = process.env.CLIENT_BASE_URL || 'http://localhost:5500';

const app = express();

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Add your production domains here
    const allowedOrigins = [
      'https://your-frontend-domain.com',
      'https://www.your-frontend-domain.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
  process.env.GOOGLE_REDIRECT_URI
);

// Facebook OAuth config
const facebookConfig = {
  clientId: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  redirectUri: process.env.FACEBOOK_REDIRECT_URI
};

// Static files
app.use('/uploads', express.static('uploads'));
app.use(express.static('.'));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,  // optional, for timeout handling
  socketTimeoutMS: 45000             // optional
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1); // stop server if connection fails
});

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
    base = `${email.split('@')[0]}_${uuidv4().slice(0, 8)}`;
    exists = await User.exists({ name: base });
  }

  return base;
};

// Google OAuth Routes

app.get('/api/auth/google', (req, res) => {
  const scopes = ['profile', 'email'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });
  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI
    });
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
    res.redirect(`${FRONTEND_BASE_URL}/dashboard.html?token=${token}&user=${encodeURIComponent(JSON.stringify({
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture
    }))}`);  
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect('${FRONTEND_BASE_URL}/?error=oauth_failed');
  }
});

// Facebook OAuth Routes
app.get('/api/auth/facebook', (req, res) => {
  const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${facebookConfig.clientId}&redirect_uri=${encodeURIComponent(facebookConfig.redirectUri)}&scope=email,public_profile`;
  res.redirect(url);
});

app.get('/api/auth/facebook/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    // Exchange code for access token
    const tokenResponse = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${facebookConfig.clientId}&redirect_uri=${encodeURIComponent(facebookConfig.redirectUri)}&client_secret=${facebookConfig.clientSecret}&code=${code}`);
    
    const { access_token } = tokenResponse.data;
    
    // Get user info
    const userResponse = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`);
    const userData = userResponse.data;
    
    let user = await User.findOne({ email: userData.email });
    
    if (!user) {
      user = new User({
        name: userData.name,
        email: userData.email,
        password: 'facebook-auth',
        profilePicture: userData.picture?.data?.url,
        isFacebookAuth: true,
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
    console.error('Facebook OAuth error:', error);
    res.redirect('http://127.0.0.1:5500/?error=facebook_oauth_failed');
  }
});

// Auth status check
app.get('/api/auth/status', (req, res) => {
  res.json({
    authentication: 'email/password + Google OAuth + Facebook OAuth',
    endpoints: {
      register: '/api/auth/register',
      login: '/api/auth/login',
      googleAuth: '/api/auth/google',
      facebookAuth: '/api/auth/facebook'
    }
  });
});

// Test CI/CD endpoint
app.get("/test-ci", (req, res) => {
  res.send("CI/CD pipeline working ✅");
});

// Debug weather route
app.get("/api/weather-debug", (req, res) => {
  res.json({ message: "Weather API is connected", timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/email-otp', emailOtpRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api', contactRoutes);
app.use('/api', roleBasedRoutes);

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
