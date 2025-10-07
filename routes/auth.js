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
    
    // Check if user signed up with Google/Facebook
    if (user.isGoogleAuth) {
      return res.status(400).json({ error: 'Please login with Google' });
    }
    
    // Check if password exists
    if (!user.password) {
      return res.status(400).json({ error: 'Account setup incomplete. Please contact support' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect password. Please try again' });
    }
    
    // Fix invalid role for old users
    let userRole = user.role;
    if (!['farmer', 'pilot', 'retail', 'admin'].includes(userRole)) {
      userRole = 'farmer';
      user.role = 'farmer';
      await user.save();
    }
    
    const token = user.generateToken();
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: userRole }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }
    
    const resetToken = user.generateResetToken();
    await user.save();
    
    res.json({
      message: 'Reset token generated successfully',
      resetToken,
      expiresIn: '10 minutes'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate reset token' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;