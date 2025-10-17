const express = require("express");
const Farmer = require("../models/Farmer");
const farmerUpload = require('../middleware/farmerUpload');

const router = express.Router();

const mongoose = require("mongoose");
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Multer error:', err);
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

router.post("/test", async (req, res) => {
  try {
    console.log('📝 Test route hit');
    res.json({ success: true, message: "Test route working", body: req.body });
  } catch (error) {
    console.error('❌ Test route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/simple", farmerUpload.single('aadharFront'), async (req, res) => {
  try {
    console.log('📝 Simple upload test');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const farmerData = {
      ...req.body,
      farmLocation: {
        latitude: req.body.latitude,
        longitude: req.body.longitude
      }
    };
    
    if (req.file) {
      farmerData.aadharFront = req.file.path;
    }
    
    const farmer = new Farmer(farmerData);
    await farmer.save();
    
    res.json({
      success: true,
      message: "Simple upload successful",
      farmer: farmer
    });
  } catch (error) {
    console.error('❌ Simple upload error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/", 
  farmerUpload.any(),
  handleMulterError,
  async (req, res) => {
  try {
    console.log('📝 Farmer registration request received');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    
    const getField = (fieldName) => {
      if (req.body[fieldName]) return req.body[fieldName];
      
      for (let key in req.body) {
        if (key.trim() === fieldName) {
          return req.body[key];
        }
      }
      return '';
    };
    
    const farmerData = {
      fullName: getField('fullName').trim(),
      mobile: getField('mobile').trim(),
      email:getField('email').trim(),
      village: getField('village').trim(),
      block: getField('block').trim(),
      district: getField('district').trim(),
      state: getField('state').trim(),
      pin: getField('pin').trim(),
      category: getField('category').trim(),
      farmArea: parseFloat(getField('farmArea')),
      primaryCrops: getField('primaryCrops').trim(),
      aadharNumber: getField('aadharNumber').trim(),
      panNumber: getField('panNumber') || '',
      accountHolder: getField('accountHolder').trim(),
      bankName: getField('bankName').trim(),
      branch: getField('branch').trim(),
      accountNumber: getField('accountNumber').trim(),
      ifsc: getField('ifsc').trim().toUpperCase(),
      upi: getField('upi') || '',
      farmLocation: {
        latitude: parseFloat(getField('latitude')),
        longitude: parseFloat(getField('longitude'))
      }
    };
    
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fieldName = file.fieldname.trim();
        if (fieldName === 'aadharFront') farmerData.aadharFront = file.path;
        if (fieldName === 'aadharBack') farmerData.aadharBack = file.path;
        if (fieldName === 'selfie') farmerData.selfie = file.path;
        if (fieldName === 'cheque') farmerData.cheque = file.path;
        if (fieldName === 'farmPhoto') farmerData.farmPhoto = file.path;
      });
    }
    
    const farmer = new Farmer(farmerData);
    await farmer.save();
    
    const statusInfo = {
      farmerId: farmer.farmerId,
      registrationDate: farmer.registrationDate,
      verifiedBy: "Not Verified",
      status: farmer.status
    };
    
    res.status(201).json({
      success: true,
      message: "Farmer registered successfully",
      data: {
        farmer: farmer,
        statusInfo: statusInfo
      }
    });
  } catch (error) {
    console.error('❌ Farmer registration error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const farmers = await Farmer.find();
    res.json({
      success: true,
      data: farmers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/status/by-email", async (req, res) => {
  try {
    const { email } = req.query; // Use req.query to get parameters from the URL

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email query parameter is required"
      });
    }

    // ✅ FIX APPLIED: Use case-insensitive search (RegEx with 'i' flag)
    const farmer = await Farmer.findOne({ 
        email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    if (!farmer) {
      // Return success: true but no data if KYC is not submitted yet
      return res.json({
        success: true,
        message: "No KYC data found for this email",
        data: { farmer: null } // Explicitly return null farmer to indicate status is "Not Submitted"
      });
    }
    
    // Construct the status info object
    const statusInfo = {
      farmerId: farmer.farmerId,
      registrationDate: farmer.registrationDate,
      verifiedBy: farmer.status === "Pending" ? "Not Verified" : (farmer.verifiedBy || "N/A"),
      status: farmer.status
    };

    // Return the full farmer object and the status info
    res.json({
      success: true,
      message: "Farmer status retrieved successfully",
      data: {
        farmer: farmer, // Return the full farmer object as requested by your frontend logic
        statusInfo: statusInfo
      }
    });
  } catch (error) {
    console.error('❌ GET /status/by-email error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
router.get("/status/:farmerId", async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ farmerId: req.params.farmerId });
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found"
      });
    }
    
    const statusInfo = {
      farmerId: farmer.farmerId,
      registrationDate: farmer.registrationDate,
      verifiedBy: farmer.status === "Pending" ? "Not Verified" : (farmer.verifiedBy || "N/A"),
      status: farmer.status
    };
    
    res.json({
      success: true,
      data: statusInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


router.get("/:id/status-info", async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found"
      });
    }
    
    const statusInfo = {
      farmerId: farmer.farmerId,
      registrationDate: farmer.registrationDate,
      verifiedBy: farmer.status === "Pending" ? "Not Verified" : (farmer.verifiedBy || "N/A"),
      status: farmer.status
    };
    
    res.json({
      success: true,
      data: statusInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.patch("/:id/images", farmerUpload.fields([
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'cheque', maxCount: 1 },
  { name: 'farmPhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const updateData = {};
    
    if (req.files) {
      if (req.files.aadharFront) updateData.aadharFront = req.files.aadharFront[0].path;
      if (req.files.aadharBack) updateData.aadharBack = req.files.aadharBack[0].path;
      if (req.files.selfie) updateData.selfie = req.files.selfie[0].path;
      if (req.files.cheque) updateData.cheque = req.files.cheque[0].path;
      if (req.files.farmPhoto) updateData.farmPhoto = req.files.farmPhoto[0].path;
    }
    
    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found"
      });
    }
    
    res.json({
      success: true,
      message: "Farmer images updated",
      data: farmer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status, verifiedBy } = req.body;
    const farmer = await Farmer.findByIdAndUpdate(
      req.params.id,
      { status, verifiedBy },
      { new: true }
    );
    
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found"
      });
    }
    
    res.json({
      success: true,
      message: "Farmer status updated",
      data: farmer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!isValidObjectId(id)) {
            return res.status(404).json({
                success: false,
                message: "Resource not found or invalid ID format"
            });
        }

        const farmer = await Farmer.findById(id);
        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: "Farmer not found"
            });
        }
        res.json({
            success: true,
            data: farmer
        });
    } catch (error) {
        console.error('❌ GET /:id error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
