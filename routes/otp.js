const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const OTP = require('../models/OTP');
const router = express.Router();

// Firebase setup (optional)
let admin;
try {
  admin = require('firebase-admin');
  // Initialize Firebase (you'll need to add your config)
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  }
} catch (error) {
  console.log('Firebase not configured, using fallback SMS');
}

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || phone.length !== 10) {
      return res.status(400).json({ error: 'Valid 10-digit phone number required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to database
    await OTP.findOneAndDelete({ phone }); // Remove existing OTP
    const otpDoc = new OTP({ phone, otp });
    await otpDoc.save();
    console.log(`✅ OTP saved: ${phone} -> ${otp}`);

    // Send OTP via Fast2SMS
    const message = `Your OTP for Agritek login is: ${otp}. Valid for 5 minutes.`;
    
    try {
      let smsSuccess = false;
      
      // Try Firebase first (if configured)
      if (admin && process.env.FIREBASE_PROJECT_ID) {
        try {
          console.log(`🔥 Sending Firebase SMS to +91${phone}`);
          // Firebase doesn't directly send SMS, but you can use it with Twilio/other providers
          // For now, we'll use the fallback
          throw new Error('Firebase SMS not implemented yet');
        } catch (firebaseError) {
          console.log('🔥 Firebase SMS failed, trying alternatives');
        }
      }
      
      // Try Textbelt
      if (!smsSuccess) {
        console.log(`📱 Sending SMS via Textbelt to +91${phone}`);
        const response = await axios.post('https://textbelt.com/text', {
          phone: `+91${phone}`,
          message: message,
          key: 'ynIBRYIr6FMqzPwxr64AnpqS33mbbqX0'
        });
        
        console.log('📨 Textbelt Response:', response.data);
        
        if (response.data.success) {
          smsSuccess = true;
          res.json({ success: true, message: 'OTP sent to your phone!' });
        } else {
          throw new Error('Textbelt quota exhausted');
        }
      }
    } catch (smsError) {
      console.log('❌ SMS Error:', smsError.message);
      console.log(`\n🔐 OTP for ${phone}: ${otp}\n`);
      res.json({ 
        success: true, 
        message: 'SMS service unavailable. Use this OTP for testing:', 
        otp: otp,
        note: 'In production, configure Firebase or other SMS service'
      });
    }
  } catch (error) {
    console.error('OTP Send Error:', error);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
});

// Verify OTP and Login
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    
    // Find and verify OTP
    console.log(`🔍 Verifying: ${phone} -> ${otp}`);
    
    // Check all OTPs for this phone
    const allOtps = await OTP.find({ phone });
    console.log(`📋 All OTPs for ${phone}:`, allOtps);
    
    const otpDoc = await OTP.findOne({ phone, otp });
    console.log(`📋 Found OTP doc:`, otpDoc);
    
    if (!otpDoc) {
      return res.status(400).json({ 
        error: 'Invalid or expired OTP',
        debug: { phone, otp, allOtps }
      });
    }

    console.log('✅ OTP verified successfully');
    
    // Find or create user
    let user = await User.findOne({ phone });
    console.log('👤 Existing user:', user);
    
    if (!user) {
      console.log('🆕 Creating new user');
      user = new User({ 
        phone, 
        name: name || `User_${phone}`,
        role: 'user'
      });
      await user.save();
      console.log('✅ User created:', user);
    }

    // Delete used OTP
    await OTP.findByIdAndDelete(otpDoc._id);
    console.log('🗑️ OTP deleted');

    // Generate token
    const token = user.generateToken();
    console.log('🔑 Token generated');

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role }
    });
    console.log('📤 Response sent successfully');
  } catch (error) {
    console.error('OTP Verify Error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;