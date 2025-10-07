const express = require('express');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const OTP = require('../models/OTP');
const router = express.Router();

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Send Email OTP
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to database
    await OTP.findOneAndDelete({ phone: email }); // Using phone field for email
    const otpDoc = new OTP({ phone: email, otp });
    await otpDoc.save();
    console.log(`✅ Email OTP saved: ${email} -> ${otp}`);

    // Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'agritek@gmail.com',
      to: email,
      subject: 'Your Agritek Login OTP',
      html: `
        <h2>Agritek Login OTP</h2>
        <p>Your OTP for login is: <strong>${otp}</strong></p>
        <p>Valid for 5 minutes only.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to: ${email}`);
      res.json({ success: true, message: 'OTP sent to your email!' });
    } catch (emailError) {
      console.log('❌ Email Error:', emailError.message);
      res.json({ 
        success: true, 
        message: 'Email service unavailable. Use this OTP:', 
        otp: otp 
      });
    }
  } catch (error) {
    console.error('Email OTP Error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Forgot Password - Send Reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to database
    await OTP.findOneAndDelete({ phone: email }); // Using phone field for email
    const otpDoc = new OTP({ phone: email, otp });
    await otpDoc.save();
    console.log(`✅ Password Reset OTP saved: ${email} -> ${otp}`);

    // Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'agritek@gmail.com',
      to: email,
      subject: 'Password Reset OTP - Agritek',
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is: <strong>${otp}</strong></p>
        <p>Valid for 5 minutes only.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Password reset email sent to: ${email}`);
      res.json({ success: true, message: 'Password reset OTP sent to your email!' });
    } catch (emailError) {
      console.log('❌ Email Error:', emailError.message);
      res.json({ 
        success: true, 
        message: 'Email service unavailable. Use this OTP:', 
        otp: otp 
      });
    }
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Failed to send reset OTP' });
  }
});

// Reset Password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    console.log(`🔍 Verifying reset OTP: ${email} -> ${otp}`);
    const otpDoc = await OTP.findOne({ phone: email, otp });
    
    if (!otpDoc) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    console.log('✅ Reset OTP verified successfully');
    
    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    // Delete used OTP
    await OTP.findByIdAndDelete(otpDoc._id);

    console.log('✅ Password reset successful');
    res.json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Verify Email OTP
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp, name, role } = req.body;
    
    console.log(`🔍 Verifying email OTP: ${email} -> ${otp}`);
    const otpDoc = await OTP.findOne({ phone: email, otp });
    
    if (!otpDoc) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    console.log('✅ Email OTP verified successfully');
    
    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ 
        email, 
        name: name || `User_${email.split('@')[0]}`,
        role: role || 'farmer'
      });
      await user.save();
    }

    // Delete used OTP
    await OTP.findByIdAndDelete(otpDoc._id);

    // Generate token
    const token = user.generateToken();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Email OTP Verify Error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;