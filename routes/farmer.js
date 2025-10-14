const express = require("express");
const Farmer = require("../models/Farmer");

const router = express.Router();

// Register farmer
router.post("/register", async (req, res) => {
  try {
    const farmer = new Farmer(req.body);
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