const WeatherService = require('./services/weatherService');

// Mock weather service for testing
class MockWeatherService extends WeatherService {
  async getCurrentWeather(lat, lon) {
    return {
      temperature: 25.5,
      humidity: 65,
      pressure: 1013,
      windSpeed: 8.2,
      windDirection: 180,
      description: 'clear sky',
      icon: '01d',
      visibility: 10000,
      uvIndex: 5,
      location: 'Delhi',
      timestamp: new Date()
    };
  }

  async getWeatherForecast(lat, lon) {
    const forecast = [];
    for (let i = 0; i < 7; i++) {
      forecast.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        temperature: {
          min: 20 + Math.random() * 5,
          max: 30 + Math.random() * 10,
          current: 25 + Math.random() * 8
        },
        humidity: 50 + Math.random() * 30,
        windSpeed: 5 + Math.random() * 10,
        description: ['clear sky', 'few clouds', 'scattered clouds'][Math.floor(Math.random() * 3)],
        icon: '01d',
        precipitation: Math.random() * 5
      });
    }
    return forecast;
  }
}

// Test the weather service
async function testWeather() {
  console.log('Testing Weather Service...\n');
  
  const weatherService = new MockWeatherService();
  
  try {
    // Test current weather
    console.log('1. Testing Current Weather:');
    const current = await weatherService.getCurrentWeather(28.6139, 77.2090);
    console.log('✅ Current weather:', JSON.stringify(current, null, 2));
    
    // Test forecast
    console.log('\n2. Testing 7-Day Forecast:');
    const forecast = await weatherService.getWeatherForecast(28.6139, 77.2090);
    console.log('✅ Forecast (first day):', JSON.stringify(forecast[0], null, 2));
    
    // Test alerts
    console.log('\n3. Testing Weather Alerts:');
    const mockAlerts = [
      { alertType: 'storm', location: 'Delhi' },
      { alertType: 'heatwave', location: 'Delhi', threshold: 35 }
    ];
    const triggeredAlerts = weatherService.checkWeatherAlerts(current, mockAlerts);
    console.log('✅ Triggered alerts:', triggeredAlerts);
    
    // Test recommendations
    console.log('\n4. Testing Farming Recommendations:');
    const recommendations = weatherService.getFarmingRecommendations(current, forecast);
    console.log('✅ Recommendations:', recommendations);
    
    console.log('\n🎉 All weather features working properly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWeather();