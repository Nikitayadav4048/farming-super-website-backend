const express = require("express");
const multer = require("multer");
const path = require("path");
const Farmer = require("../models/Farmer");

const router = express.Router();

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/farmers/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPEG, JPG, and PNG images are allowed"));
    }
  },
});

// Register farmer with image uploads
router.post("/register", upload.fields([
  { name: "aadharFront", maxCount: 1 },
  { name: "aadharBack", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
  { name: "cheque", maxCount: 1 },
  { name: "farmPhoto", maxCount: 1 }
]), async (req, res) => {
  try {
    const farmerData = { ...req.body };
    
    // Add file paths to farmer data
    if (req.files) {
      if (req.files.aadharFront) farmerData.aadharFront = req.files.aadharFront[0].path;
      if (req.files.aadharBack) farmerData.aadharBack = req.files.aadharBack[0].path;
      if (req.files.selfie) farmerData.selfie = req.files.selfie[0].path;
      if (req.files.cheque) farmerData.cheque = req.files.cheque[0].path;
      if (req.files.farmPhoto) farmerData.farmPhoto = req.files.farmPhoto[0].path;
    }

    const farmer = new Farmer(farmerData);
    await farmer.save();
    
    res.status(201).json({
      success: true,
      message: "Farmer registered successfully",
      data: farmer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all farmers
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

// Get farmer by ID
router.get("/:id", async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update farmer status
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

module.exports = router;