const express = require('express');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send reset password OTP
router.post('/send-reset-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await OTP.findOneAndDelete({ phone: email });
    const otpDoc = new OTP({ phone: email, otp });
    await otpDoc.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Password - Agritek',
      html: `
        <h2>Reset Your Password</h2>
        <p>Your OTP for password reset is: <strong>${otp}</strong></p>
        <p>Valid for 5 minutes only.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'Reset OTP sent to your email' });
    } catch (emailError) {
      res.json({ success: true, message: 'Email service unavailable. Use this OTP:', otp });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reset OTP' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const otpDoc = await OTP.findOne({ phone: email, otp });
    if (!otpDoc) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();
    
    await OTP.findByIdAndDelete(otpDoc._id);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;