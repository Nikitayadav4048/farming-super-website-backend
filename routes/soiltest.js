const express = require("express");
const SoilTest = require("../models/SoilTest");
const Farmer = require("../models/Farmer");
const router = express.Router();

// Request soil test
router.post("/", async (req, res) => {
  try {
    const { farmerId, location, cropType, preferredDate, testFee } = req.body;
    
    const farmer = await Farmer.findOne({ farmerId });
    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found"
      });
    }

    const soilTest = new SoilTest({
      farmerId,
      location,
      cropType,
      preferredDate,
      testFee: testFee || 50
    });

    await soilTest.save();

    res.status(201).json({
      success: true,
      message: "Your soil test request has been received. Our field expert will collect a sample within 48 hours.",
      data: soilTest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get farmer's soil tests
router.get("/farmer/:farmerId", async (req, res) => {
  try {
    const soilTests = await SoilTest.find({ farmerId: req.params.farmerId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: soilTests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get latest soil test for farmer
router.get("/farmer/:farmerId/latest", async (req, res) => {
  try {
    const latestTest = await SoilTest.findOne({ farmerId: req.params.farmerId })
      .sort({ createdAt: -1 });
    
    if (!latestTest) {
      return res.json({
        success: true,
        data: {
          status: "Not Done Yet",
          lastTestDate: "N/A",
          soilQuality: "N/A",
          cropRecommendation: "N/A"
        }
      });
    }

    res.json({
      success: true,
      data: latestTest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update test results (for lab/API integration)
router.patch("/:sampleId/results", async (req, res) => {
  try {
    const { ph, nitrogen, phosphorus, potassium, organicCarbon, recommendedCrops, fertilizerAdvice } = req.body;
    
    const soilTest = await SoilTest.findOneAndUpdate(
      { sampleId: req.params.sampleId },
      {
        results: {
          ph,
          nitrogen,
          phosphorus,
          potassium,
          organicCarbon,
          recommendedCrops,
          fertilizerAdvice
        },
        status: "Completed",
        completionDate: new Date()
      },
      { new: true }
    );

    if (!soilTest) {
      return res.status(404).json({
        success: false,
        message: "Soil test not found"
      });
    }

    res.json({
      success: true,
      message: "Test results updated",
      data: soilTest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update test status
router.patch("/:sampleId/status", async (req, res) => {
  try {
    const { status } = req.body;
    
    const soilTest = await SoilTest.findOneAndUpdate(
      { sampleId: req.params.sampleId },
      { status },
      { new: true }
    );

    if (!soilTest) {
      return res.status(404).json({
        success: false,
        message: "Soil test not found"
      });
    }

    res.json({
      success: true,
      message: "Status updated",
      data: soilTest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all pending tests (for pilot dashboard)
router.get("/pending", async (req, res) => {
  try {
    const pendingTests = await SoilTest.find({ 
      status: { $in: ["Requested", "Sample Collected"] }
    }).populate('farmerId', 'fullName mobile village');
    
    res.json({
      success: true,
      data: pendingTests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;