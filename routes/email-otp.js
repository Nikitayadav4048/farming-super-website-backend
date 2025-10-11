const express = require('express');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const OTP = require('../models/OTP');
const router = express.Router();

// Log email configuration for debugging
console.log('📧 Email Config:', {
  user: process.env.EMAIL_USER || 'swati2003jain@gmail.com',
  pass: process.env.EMAIL_PASS ? '***configured***' : '***using-fallback***'
});

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'swati2003jain@gmail.com',
    pass: process.env.EMAIL_PASS || 'zxvsdyjusprauqcu'
  }
});

// Send Email OTP for Registration
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log(`📧 Sending registration OTP to: ${email}`);
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Allow OTP sending for registration (user check will be done during registration)

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to database
    await OTP.findOneAndDelete({ phone: email }); // Using phone field for email
    const otpDoc = new OTP({ phone: email, otp });
    await otpDoc.save();
    console.log(`✅ Registration OTP saved: ${email} -> ${otp}`);

    // Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'agritek@gmail.com',
      to: email,
      subject: 'Verify Your Email - Agritek Registration',
      html: `
        <h2>Agritek Email Verification</h2>
        <p>Your OTP for email verification is: <strong>${otp}</strong></p>
        <p>Valid for 5 minutes only.</p>
        <p>Enter this OTP to verify your email and complete registration.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Registration email sent to: ${email}`);
      res.json({ success: true, message: 'Verification OTP sent to your email!' });
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

// Resend OTP (No user existence check)
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log(`🔄 Resending OTP to: ${email}`);
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Delete old OTP and save new one
    await OTP.findOneAndDelete({ phone: email });
    const otpDoc = new OTP({ phone: email, otp });
    await otpDoc.save();
    console.log(`✅ Resend OTP saved: ${email} -> ${otp}`);

    // Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'agritek@gmail.com',
      to: email,
      subject: 'Resend OTP - Agritek Verification',
      html: `
        <h2>Resend OTP - Agritek</h2>
        <p>Your new OTP is: <strong>${otp}</strong></p>
        <p>Valid for 5 minutes only.</p>
        <p>Enter this OTP to verify your email.</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Resend OTP email sent to: ${email}`);
      res.json({ success: true, message: 'New OTP sent to your email!' });
    } catch (emailError) {
      console.log('❌ Email Error:', emailError.message);
      res.json({ 
        success: true, 
        message: 'Email service unavailable. Use this OTP:', 
        otp: otp 
      });
    }
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// Verify Email OTP (Step 2: Only verify OTP, don't create user)
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log(`🔍 Verifying email OTP: ${email} -> ${otp}`);
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    const otpDoc = await OTP.findOne({ phone: email, otp });
    
    if (!otpDoc) {
      console.log(`❌ OTP not found for ${email} with OTP ${otp}`);
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    console.log('✅ Email OTP verified successfully');
    
    // Mark OTP as verified but don't delete yet
    otpDoc.verified = true;
    await otpDoc.save();
    
    res.json({
      success: true,
      message: 'Email verified successfully! You can now complete registration.',
      emailVerified: true
    });
  } catch (error) {
    console.error('Email OTP Verify Error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

module.exports = router;


