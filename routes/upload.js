const express = require('express');
const upload = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Single file upload
router.post('/single', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Multiple files upload
router.post('/multiple', authenticateToken, upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      path: file.path
    }));
    
    res.json({
      message: 'Files uploaded successfully',
      files
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Profile picture upload
router.post('/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No profile picture uploaded' });
    }
    
    // Update user profile picture path in database
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, {
      profilePicture: req.file.path
    });
    
    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: req.file.path
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;