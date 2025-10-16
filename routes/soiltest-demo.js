const express = require("express");
const SoilTest = require("../models/SoilTest");
const SoilTestService = require("../services/soilTestService");
const router = express.Router();

// Demo: Complete soil test flow
router.post("/demo-complete/:sampleId", async (req, res) => {
  try {
    const soilTest = await SoilTest.findOne({ sampleId: req.params.sampleId });
    
    if (!soilTest) {
      return res.status(404).json({
        success: false,
        message: "Soil test not found"
      });
    }

    // Simulate external API call
    const apiResult = await SoilTestService.submitToExternalLab(soilTest);
    
    if (!apiResult.success) {
      return res.status(500).json({
        success: false,
        message: "External lab API failed"
      });
    }

    // Update soil test with results
    soilTest.results = {
      ph: apiResult.data.ph,
      nitrogen: apiResult.data.nitrogen,
      phosphorus: apiResult.data.phosphorus,
      potassium: apiResult.data.potassium,
      organicCarbon: apiResult.data.organic_carbon,
      recommendedCrops: apiResult.data.recommended_crops,
      fertilizerAdvice: apiResult.data.fertilizer_advice
    };
    soilTest.status = "Completed";
    soilTest.completionDate = new Date();
    
    await soilTest.save();

    // Format response for frontend
    const formattedReport = SoilTestService.formatSoilReport(soilTest.results);

    res.json({
      success: true,
      message: "Soil test completed successfully",
      data: {
        soilTest,
        formattedReport
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get dashboard data for farmer
router.get("/dashboard/:farmerId", async (req, res) => {
  try {
    const latestTest = await SoilTest.findOne({ farmerId: req.params.farmerId })
      .sort({ createdAt: -1 });
    
    if (!latestTest) {
      return res.json({
        success: true,
        data: {
          soilTestStatus: "❌ Not Done Yet",
          lastTestDate: "N/A",
          soilQuality: "N/A",
          cropRecommendation: "N/A",
          hasTest: false
        }
      });
    }

    if (latestTest.status !== "Completed") {
      return res.json({
        success: true,
        data: {
          soilTestStatus: `🔄 ${latestTest.status}`,
          lastTestDate: latestTest.requestDate.toDateString(),
          soilQuality: "Testing in progress...",
          cropRecommendation: "Awaiting results",
          hasTest: true,
          sampleId: latestTest.sampleId
        }
      });
    }

    const formattedReport = SoilTestService.formatSoilReport(latestTest.results);

    res.json({
      success: true,
      data: {
        soilTestStatus: "✅ Completed",
        lastTestDate: latestTest.completionDate.toDateString(),
        soilQuality: formattedReport.ph,
        cropRecommendation: latestTest.results.recommendedCrops.join(", "),
        hasTest: true,
        fullReport: formattedReport,
        sampleId: latestTest.sampleId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;