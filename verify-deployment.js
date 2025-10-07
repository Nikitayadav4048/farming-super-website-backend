const axios = require('axios');

async function verifyDeployment() {
  const baseUrl = 'https://staging.agritek.co.in';
  
  console.log('🚀 Verifying deployment...\n');
  
  // Wait a bit for deployment
  console.log('⏳ Waiting 30 seconds for deployment...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  const tests = [
    {
      name: 'Test CI Endpoint',
      method: 'GET',
      url: `${baseUrl}/test-ci`,
      expected: 'CI/CD pipeline working'
    },
    {
      name: 'Auth Status',
      method: 'GET', 
      url: `${baseUrl}/api/auth/status`,
      expected: 'authentication'
    },
    {
      name: 'Forgot Password API',
      method: 'POST',
      url: `${baseUrl}/api/forgot-password/send-reset-token`,
      data: { email: 'test@example.com' },
      expected: 'error' // Will get user not found, but API should exist
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n--- ${test.name} ---`);
      
      let response;
      if (test.method === 'POST') {
        response = await axios.post(test.url, test.data, {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        response = await axios.get(test.url);
      }
      
      const responseText = JSON.stringify(response.data);
      if (responseText.includes(test.expected)) {
        console.log('✅ PASS - API working correctly');
        console.log('Response:', response.data);
      } else {
        console.log('⚠️  PARTIAL - API exists but unexpected response');
        console.log('Response:', response.data);
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ FAIL - API not deployed yet (404)');
      } else if (error.response?.status >= 400 && error.response?.status < 500) {
        console.log('✅ PASS - API exists (client error expected)');
        console.log('Response:', error.response.data);
      } else {
        console.log('❌ ERROR -', error.message);
      }
    }
  }
  
  console.log('\n🏁 Deployment verification complete!');
}

verifyDeployment();