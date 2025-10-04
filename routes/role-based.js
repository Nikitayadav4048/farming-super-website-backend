const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'farming-secret-key', async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = await User.findById(decoded.id);
    next();
  });
};

// Role check middleware
const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied for your role' });
  }
  next();
};

// ADMIN APIs
router.get('/admin/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  const users = await User.find({}, '-password');
  res.json({ users });
});

router.delete('/admin/user/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
});

// FARMER APIs
router.get('/farmer/dashboard', authenticateToken, requireRole(['farmer']), (req, res) => {
  res.json({ 
    message: 'Farmer Dashboard',
    features: ['Crop Management', 'Weather', 'Market Prices']
  });
});

router.post('/farmer/crop', authenticateToken, requireRole(['farmer']), (req, res) => {
  res.json({ message: 'Crop data saved', data: req.body });
});

// PILOT APIs
router.get('/pilot/dashboard', authenticateToken, requireRole(['pilot']), (req, res) => {
  res.json({ 
    message: 'Pilot Dashboard',
    features: ['Flight Schedule', 'Drone Status', 'Field Mapping']
  });
});

router.post('/pilot/flight', authenticateToken, requireRole(['pilot']), (req, res) => {
  res.json({ message: 'Flight scheduled', data: req.body });
});

// RETAIL APIs
router.get('/retail/dashboard', authenticateToken, requireRole(['retail']), (req, res) => {
  res.json({ 
    message: 'Retail Dashboard',
    features: ['Inventory', 'Orders', 'Suppliers']
  });
});

router.post('/retail/order', authenticateToken, requireRole(['retail']), (req, res) => {
  res.json({ message: 'Order created', data: req.body });
});

// COMMON APIs (All roles)
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ 
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;