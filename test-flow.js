// Test Registration Flow
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testRegistrationFlow() {
  console.log('🧪 Testing Registration Flow...\n');
  
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    password: '123456',
    role: 'farmer'
  };

  try {
    // Step 1: Register (validation only)
    console.log('Step 1: Register validation...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testData);
    console.log('✅ Register Response:', registerResponse.data);
    
    // Step 2: Send OTP
    console.log('\nStep 2: Sending OTP...');
    const otpResponse = await axios.post(`${API_BASE}/email-otp/send-email-otp`, {
      email: testData.email
    });
    console.log('✅ OTP Response:', otpResponse.data);
    
    // Get OTP from response (for testing)
    const otp = otpResponse.data.otp;
    if (!otp) {
      console.log('❌ No OTP received in response');
      return;
    }
    
    // Step 3: Complete Registration
    console.log('\nStep 3: Completing registration with OTP...');
    const completeResponse = await axios.post(`${API_BASE}/auth/complete-registration`, {
      ...testData,
      otp: otp
    });
    console.log('✅ Complete Registration Response:', completeResponse.data);
    
    console.log('\n🎉 Registration flow completed successfully!');
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

// Run test
testRegistrationFlow();