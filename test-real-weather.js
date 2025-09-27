const WeatherService = require('./services/weatherService');

async function testRealWeather() {
  console.log('Testing Real Weather API...\n');
  
  const weatherService = new WeatherService();
  
  try {
    // Test current weather for Delhi
    console.log('1. Testing Current Weather (Delhi):');
    const current = await weatherService.getCurrentWeather(28.6139, 77.2090);
    console.log('✅ Current weather:', JSON.stringify(current, null, 2));
    
    // Test forecast
    console.log('\n2. Testing 7-Day Forecast:');
    const forecast = await weatherService.getWeatherForecast(28.6139, 77.2090);
    console.log('✅ Forecast (first day):', JSON.stringify(forecast[0], null, 2));
    
    // Test alerts
    console.log('\n3. Testing Weather Alerts:');
    const mockAlerts = [
      { alertType: 'heatwave', location: 'Delhi', threshold: 30 }
    ];
    const triggeredAlerts = weatherService.checkWeatherAlerts(current, mockAlerts);
    console.log('✅ Triggered alerts:', triggeredAlerts);
    
    // Test recommendations
    console.log('\n4. Testing Farming Recommendations:');
    const recommendations = weatherService.getFarmingRecommendations(current, forecast);
    console.log('✅ Recommendations:', recommendations);
    
    console.log('\n🎉 Real weather API working perfectly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRealWeather();