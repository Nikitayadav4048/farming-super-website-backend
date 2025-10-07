const axios = require('axios');

async function testWorkaround() {
  console.log('🔧 Testing workaround APIs...\n');
  
  // Wait for deployment
  console.log('⏳ Waiting 20 seconds for deployment...');
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  const tests = [
    {
      name: 'Send Reset Token (via auth route)',
      url: 'https://staging.agritek.co.in/api/auth/send-reset-token',
      data: { email: 'swati123@gmail.com' }
    },
    {
      name: 'Reset Password (via auth route)', 
      url: 'https://staging.agritek.co.in/api/auth/reset-password-token',
      data: { token: 'dummy-token', newPassword: 'newpass123' }
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`--- ${test.name} ---`);
      const response = await axios.post(test.url, test.data, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ SUCCESS:', response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Still 404 - not deployed yet');
      } else {
        console.log('✅ API EXISTS - Status:', error.response?.status);
        console.log('Response:', error.response?.data);
      }
    }
    console.log('');
  }
}

testWorkaround();