const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Step 1: Verify Email (Check availability)
router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    
    // Skip user existence check for testing - will be checked during registration
    
    res.status(200).json({
      message: 'Please check your email for OTP to verify your email address',
      requiresOTP: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Email verification failed. Please try again' });
  }
});

// Step 3: Complete Registration (After OTP verification)
const express = require('express');
const User = require('../models/User');
const OTP = require('../models/OTP');
const nodemailer = require('nodemailer');

const router = express.Router();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1️⃣ Send Email OTP
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.findOneAndDelete({ email }); // remove old OTP
    const otpDoc = new OTP({ email, otp });
    await otpDoc.save();

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Agritek',
      html: `<p>Your OTP is <strong>${otp}</strong>. Valid for 5 minutes.</p>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP for ${email}: ${otp}`);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// 2️⃣ Verify Email OTP
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const otpDoc = await OTP.findOne({ email, otp });
    if (!otpDoc) return res.status(400).json({ error: 'Invalid OTP' });

    otpDoc.isVerified = true;
    await otpDoc.save();

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// 3️⃣ Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    if (role && !['admin','pilot','farmer','retail'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    // Check OTP verification
    const otpDoc = await OTP.findOne({ email, isVerified: true });
    if (!otpDoc) return res.status(400).json({ error: 'Please verify your email with OTP first' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const user = new User({ name, email, password, role: role || 'farmer' });
    await user.save();

    await OTP.findByIdAndDelete(otpDoc._id); // remove OTP after successful registration

    res.status(201).json({ 
      success: true,
      message: 'Registration completed successfully!',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again' });
  }
});


// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email && !password) {
      return res.status(400).json({ 
        error: 'Email and password are required'
      });
    }
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required'
      });
    }
    
    if (!password) {
      return res.status(400).json({ 
        error: 'Password is required'
      });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Incorrect email format'
      });
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ 
        error: 'Email does not exist'
      });
    }
    
    // Account status checks
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Your account has been deactivated. Please contact support at support@agritek.com',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // OAuth account check
    if (user.isGoogleAuth && !user.password) {
      return res.status(400).json({ 
        error: 'This account was created with Google. Please use Google Sign-In.',
        code: 'GOOGLE_ACCOUNT_ONLY'
      });
    }
    
    if (user.isFacebookAuth && !user.password) {
      return res.status(400).json({ 
        error: 'This account was created with Facebook. Please use Facebook Sign-In.',
        code: 'FACEBOOK_ACCOUNT_ONLY'
      });
    }
    
    // Password validation
    if (!user.password || user.password === 'google-auth' || user.password === 'facebook-auth') {
      return res.status(400).json({ 
        error: 'Password not set for this account. Please use social login or reset your password.',
        code: 'NO_PASSWORD_SET'
      });
    }
    
    // Password verification
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        error: 'Incorrect password'
      });
    }
    
    // Fix invalid role for old users
    let userRole = user.role;
    if (!['farmer', 'pilot', 'retail', 'admin'].includes(userRole)) {
      userRole = 'farmer';
      user.role = 'farmer';
      await user.save();
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    const token = user.generateToken();
    
    res.json({
      success: true,
      message: 'Login successful! Welcome back.',
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: userRole,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Database connection error
    if (error.name === 'MongoNetworkError') {
      return res.status(503).json({ 
        error: 'Database connection failed. Please try again later.',
        code: 'DATABASE_ERROR'
      });
    }
    
    // Generic server error
    res.status(500).json({ 
      error: 'Login failed due to server error. Please try again.',
      code: 'SERVER_ERROR'
    });
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
    const { resetToken, newPassword, confirmPassword } = req.body;
    
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Reset token, new password and confirm password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
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

// Forgot Password Routes (Workaround for deployment issues)
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send reset password token
router.post('/send-reset-token', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    const resetToken = user.generateResetToken();
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Password - Agritek',
      html: `
        <h2>Reset Your Password</h2>
        <p>Your password reset OTP is: <strong>${resetToken}</strong></p>
        <p>Valid for 10 minutes only.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    // Always show OTP in terminal for testing
    console.log(`📧 Reset OTP for ${email}: ${resetToken}`);
    
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${email}`);
      res.json({ 
        success: true, 
        message: 'Reset OTP sent to your email',
        otp: resetToken  // Also include in response for testing
      });
    } catch (emailError) {
      console.log('❌ Email Error:', emailError.message);
      res.json({ 
        success: true, 
        message: 'Email service unavailable. Use this OTP:', 
        otp: resetToken 
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reset token' });
  }
});

// Reset password with token
router.post('/reset-password-token', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Token, new password and confirm password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const user = await User.findOne({ 
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
