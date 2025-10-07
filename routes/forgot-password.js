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

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Password - Agritek',
      html: `
        <h2>Reset Your Password</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Or use this token: <strong>${resetToken}</strong></p>
        <p>Valid for 10 minutes only.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'Reset link sent to your email' });
    } catch (emailError) {
      res.json({ success: true, message: 'Email service unavailable. Use this token:', resetToken });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reset token' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
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