const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    if (role && !['admin', 'pilot', 'farmer', 'retail'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, pilot, farmer, or retail' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email address' });
    }
    
    const user = new User({ name, email, password, role });
    await user.save();
    
    const token = user.generateToken();
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email address is already registered' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'No account found with this email address' });
    }
    
    if (!user.isActive) {
      return res.status(400).json({ error: 'Your account has been deactivated. Please contact support' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect password. Please try again' });
    }
    
    const token = user.generateToken();
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed. Please try again' });
  }
});



module.exports = router;