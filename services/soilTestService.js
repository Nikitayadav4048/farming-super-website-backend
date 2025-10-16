const axios = require('axios');

class SoilTestService {
  // Mock external API integration
  static async submitToExternalLab(soilTestData) {
    try {
      // This would be replaced with actual API endpoint
      const mockApiResponse = {
        sample_id: soilTestData.sampleId,
        ph: 6.8,
        nitrogen: "Medium",
        phosphorus: "Low", 
        potassium: "High",
        organic_carbon: "1.2%",
        recommended_crops: ["Paddy", "Banana"],
        fertilizer_advice: "Use NPK 12:32:16 @ 50kg/acre"
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        data: mockApiResponse
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static getNutrientStatus(level) {
    const statusMap = {
      'Low': { color: 'red', indicator: '🔴' },
      'Medium': { color: 'yellow', indicator: '🟡' },
      'High': { color: 'green', indicator: '🟢' }
    };
    return statusMap[level] || { color: 'gray', indicator: '⚪' };
  }

  static formatSoilReport(results) {
    return {
      ph: `${results.ph} (${results.ph < 6.5 ? 'Acidic' : results.ph > 7.5 ? 'Alkaline' : 'Neutral'})`,
      nutrients: {
        nitrogen: {
          level: results.nitrogen,
          ...this.getNutrientStatus(results.nitrogen)
        },
        phosphorus: {
          level: results.phosphorus,
          ...this.getNutrientStatus(results.phosphorus)
        },
        potassium: {
          level: results.potassium,
          ...this.getNutrientStatus(results.potassium)
        }
      },
      organicCarbon: results.organicCarbon,
      recommendations: {
        crops: results.recommendedCrops,
        fertilizer: results.fertilizerAdvice
      }
    };
  }
}

module.exports = SoilTestService;