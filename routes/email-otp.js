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