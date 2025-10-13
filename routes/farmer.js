const express = require('express');
const router = express.Router();
const Farmer = require('../models/Farmer');

// Register new farmer
router.post('/register', async (req, res) => {
  try {
    const farmer = new Farmer(req.body);
    await farmer.save();
    
    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      data: {
        farmerId: farmer.farmerId,
        fullName: farmer.fullName,
        mobile: farmer.mobile,
        status: farmer.status
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all farmers
router.get('/', async (req, res) => {
  try {
    const farmers = await Farmer.find().select('-__v');
    res.json({
      success: true,
      count: farmers.length,
      data: farmers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Search farmers by mobile or farmer ID
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const farmers = await Farmer.find({
      $or: [
        { mobile: { $regex: query, $options: 'i' } },
        { farmerId: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } }
      ]
    }).select('-__v');
    
    res.json({
      success: true,
      count: farmers.length,
      data: farmers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get farmer by farmerId (FRM000001)
router.get('/farmer-id/:farmerId', async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ farmerId: req.params.farmerId }).select('-__v');
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }
    
    res.json({
      success: true,
      data: farmer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get farmer by MongoDB ObjectId
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid farmer ID format'
      });
    }
    
    const farmer = await Farmer.findById(id).select('-__v');
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }
    
    res.json({
      success: true,
      data: farmer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update farmer status by farmerId
router.patch('/farmer-id/:farmerId/status', async (req, res) => {
  try {
    const { status, verifiedBy } = req.body;
    
    const farmer = await Farmer.findOneAndUpdate(
      { farmerId: req.params.farmerId },
      { status, verifiedBy },
      { new: true, runValidators: true }
    );
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }
    
    res.json({
      success: true,
      message: `Farmer status updated to ${status}`,
      data: {
        farmerId: farmer.farmerId,
        fullName: farmer.fullName,
        status: farmer.status,
        verifiedBy: farmer.verifiedBy
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update farmer status by MongoDB ObjectId
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, verifiedBy } = req.body;
    
    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      { status, verifiedBy },
      { new: true, runValidators: true }
    );
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
    }
    
    res.json({
      success: true,
      message: `Farmer status updated to ${status}`,
      data: {
        farmerId: farmer.farmerId,
        fullName: farmer.fullName,
        status: farmer.status,
        verifiedBy: farmer.verifiedBy
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;