const axios = require('axios');

async function testLocalForgotPassword() {
  try {
    console.log('Testing local forgot password API...');
    
    const response = await axios.post('http://localhost:3000/api/forgot-password/send-reset-token', {
      email: 'swati123@gmail.com'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Success Response:', response.data);
  } catch (error) {
    console.log('Error Status:', error.response?.status);
    console.log('Error Data:', error.response?.data);
    console.log('Error Message:', error.message);
  }
}

testLocalForgotPassword();