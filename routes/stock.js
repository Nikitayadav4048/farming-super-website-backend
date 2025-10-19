const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const upload = require('../middleware/stockUpload');
const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'farming-secret-key', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Create daily stock update
router.post('/daily-update', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { email, category, items, location, remarks } = req.body;
    
    // Parse items if it's a string
    let parsedItems;
    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    } catch (error) {
      return res.status(400).json({ error: 'Invalid items format' });
    }

    // Get uploaded image paths
    const imagePaths = req.files ? req.files.map(file => file.path) : [];

    const stockUpdate = new Stock({
      farmer_id: req.user.id,
      email,
      category,
      items: parsedItems,
      images: imagePaths,
      location,
      remarks
    });

    await stockUpdate.save();
    res.status(201).json({ 
      message: 'Stock update created successfully',
      stock: stockUpdate 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all stock updates
router.get('/updates', authenticateToken, async (req, res) => {
  try {
    const stocks = await Stock.find({ farmer_id: req.user.id }).sort({ created_at: -1 });
    res.json({ stocks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock update by ID
router.get('/update/:id', authenticateToken, async (req, res) => {
  try {
    const stock = await Stock.findOne({ 
      _id: req.params.id, 
      farmer_id: req.user.id 
    });
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock update not found' });
    }
    
    res.json({ stock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock
router.put('/update/:id', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { email, category, items, location, remarks } = req.body;
    
    let parsedItems;
    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    } catch (error) {
      return res.status(400).json({ error: 'Invalid items format' });
    }

    const updateData = {
      email,
      category,
      items: parsedItems,
      location,
      remarks
    };

    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map(file => file.path);
      updateData.images = imagePaths;
    }

    const stock = await Stock.findOneAndUpdate(
      { _id: req.params.id, farmer_id: req.user.id },
      updateData,
      { new: true }
    );

    if (!stock) {
      return res.status(404).json({ error: 'Stock update not found' });
    }

    res.json({ 
      message: 'Stock update updated successfully',
      stock 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete stock update
router.delete('/update/:id', authenticateToken, async (req, res) => {
  try {
    const stock = await Stock.findOneAndDelete({ 
      _id: req.params.id, 
      farmer_id: req.user.id 
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock update not found' });
    }

    res.json({ message: 'Stock update deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;