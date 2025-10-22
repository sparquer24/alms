// Test script to verify backend API endpoints
// Run this in browser console or create a separate test file

const API_BASE_URL = 'http://localhost:3000'; // Adjust if your backend runs on different port

async function testBackendAPIs() {
  console.log('🔍 Testing Backend API Endpoints...');
  
  // Test 1: Check if backend is running
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`);
    console.log('✅ Backend is running:', response.status);
  } catch (error) {
    console.error('❌ Backend not running or not accessible:', error);
    return;
  }
  
  // Test 2: Test GET /application-form (list all applications)
  try {
    const response = await fetch(`${API_BASE_URL}/application-form`, {
      headers: {
        'Authorization': `Bearer YOUR_TOKEN_HERE`, // Replace with actual token
        'Content-Type': 'application/json'
      }
    });
    console.log('📋 GET /application-form response:', response.status, await response.text());
  } catch (error) {
    console.error('❌ Error testing GET /application-form:', error);
  }
  
  // Test 3: Test GET /application-form/10 (get specific application)
  try {
    const response = await fetch(`${API_BASE_URL}/application-form/10`, {
      headers: {
        'Authorization': `Bearer YOUR_TOKEN_HERE`, // Replace with actual token
        'Content-Type': 'application/json'
      }
    });
    console.log('📄 GET /application-form/10 response:', response.status, await response.text());
  } catch (error) {
    console.error('❌ Error testing GET /application-form/10:', error);
  }
  
  // Test 4: Test POST /application-form (create new application)
  try {
    const testData = {
      firstName: 'Test',
      lastName: 'User',
      parentOrSpouseName: 'Test Parent',
      sex: 'MALE'
    };
    
    const response = await fetch(`${API_BASE_URL}/application-form`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer YOUR_TOKEN_HERE`, // Replace with actual token
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    console.log('📝 POST /application-form response:', response.status, await response.text());
  } catch (error) {
    console.error('❌ Error testing POST /application-form:', error);
  }
}

// Run the test
testBackendAPIs();