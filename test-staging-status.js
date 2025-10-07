const axios = require('axios');

async function testStagingAPIs() {
  const baseUrl = 'https://staging.agritek.co.in';
  
  const endpoints = [
    '/api/auth/status',
    '/test-ci',
    '/api/weather-debug',
    '/api/auth/login',
    '/api/forgot-password/send-reset-token'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n--- Testing: ${endpoint} ---`);
      const response = await axios.get(`${baseUrl}${endpoint}`);
      console.log('✅ Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Status:', error.response?.status || 'No response');
      console.log('Error:', error.response?.data || error.message);
    }
  }
}

testStagingAPIs();