const axios = require('axios');
const admin = require('firebase-admin');

// Test configuration
const BASE_URL = 'http://localhost:5001/local-hands-dev/us-central1/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const PROVIDER_EMAIL = 'provider@example.com';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to log test results
function logTest(testName, passed, error = null) {
  if (passed) {
    console.log(`✅ ${testName}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName}: ${error}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error });
  }
}

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

// Test suite
async function runTests() {
  console.log('🚀 Starting Local Hands Backend Test Suite\n');

  let customerToken = null;
  let providerToken = null;
  let customerId = null;
  let providerId = null;
  let serviceId = null;
  let bookingId = null;

  // 1. HEALTH CHECK
  console.log('📋 HEALTH CHECK TESTS');
  try {
    const healthCheck = await makeRequest('GET', '/');
    logTest('API Health Check', healthCheck.success && healthCheck.data.success);
  } catch (error) {
    logTest('API Health Check', false, error.message);
  }

  // 2. AUTHENTICATION TESTS
  console.log('\n🔐 AUTHENTICATION TESTS');

  // Test customer registration
  try {
    const customerReg = await makeRequest('POST', '/auth/register', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: 'Test Customer',
      role: 'customer',
      phone: '+1234567890'
    });
    
    logTest('Customer Registration', customerReg.success);
    if (customerReg.success) {
      customerId = customerReg.data.data.user.id;
    }
  } catch (error) {
    logTest('Customer Registration', false, error.message);
  }

  // Test provider registration
  try {
    const providerReg = await makeRequest('POST', '/auth/register', {
      email: PROVIDER_EMAIL,
      password: TEST_PASSWORD,
      displayName: 'Test Provider',
      role: 'provider',
      phone: '+1234567891'
    });
    
    logTest('Provider Registration', providerReg.success);
    if (providerReg.success) {
      providerId = providerReg.data.data.user.id;
    }
  } catch (error) {
    logTest('Provider Registration', false, error.message);
  }

  // Test duplicate email registration
  try {
    const duplicateReg = await makeRequest('POST', '/auth/register', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: 'Duplicate User',
      role: 'customer'
    });
    
    logTest('Duplicate Email Prevention', !duplicateReg.success && duplicateReg.status === 400);
  } catch (error) {
    logTest('Duplicate Email Prevention', false, error.message);
  }

  // Test password reset
  try {
    const resetPassword = await makeRequest('POST', '/auth/reset-password', {
      email: TEST_EMAIL
    });
    
    logTest('Password Reset Request', resetPassword.success);
  } catch (error) {
    logTest('Password Reset Request', false, error.message);
  }

  // 3. USER MANAGEMENT TESTS
  console.log('\n👤 USER MANAGEMENT TESTS');

  // Test get user profile (should fail without auth)
  try {
    const profileNoAuth = await makeRequest('GET', '/users/me');
    logTest('Profile Access Without Auth', !profileNoAuth.success && profileNoAuth.status === 401);
  } catch (error) {
    logTest('Profile Access Without Auth', false, error.message);
  }

  // Test get user by ID
  if (customerId) {
    try {
      const userProfile = await makeRequest('GET', `/users/${customerId}`);
      logTest('Get User Profile by ID', userProfile.success);
    } catch (error) {
      logTest('Get User Profile by ID', false, error.message);
    }
  }

  // 4. SERVICE MANAGEMENT TESTS
  console.log('\n🔧 SERVICE MANAGEMENT TESTS');

  // Test get all services (public endpoint)
  try {
    const allServices = await makeRequest('GET', '/services');
    logTest('Get All Services (Public)', allServices.success);
  } catch (error) {
    logTest('Get All Services (Public)', false, error.message);
  }

  // Test service search with filters
  try {
    const searchServices = await makeRequest('GET', '/services?category=plumbing&location[latitude]=40.7128&location[longitude]=-74.0060&location[radius]=25');
    logTest('Service Search with Filters', searchServices.success);
  } catch (error) {
    logTest('Service Search with Filters', false, error.message);
  }

  // Test get service categories
  try {
    const categories = await makeRequest('GET', '/services/categories/list');
    logTest('Get Service Categories', categories.success);
  } catch (error) {
    logTest('Get Service Categories', false, error.message);
  }

  // 5. PROVIDER TESTS
  console.log('\n🏢 PROVIDER TESTS');

  // Test get all providers
  try {
    const allProviders = await makeRequest('GET', '/providers');
    logTest('Get All Providers', allProviders.success);
  } catch (error) {
    logTest('Get All Providers', false, error.message);
  }

  // Test get provider by ID
  if (providerId) {
    try {
      const providerProfile = await makeRequest('GET', `/providers/${providerId}`);
      logTest('Get Provider Profile', providerProfile.success);
    } catch (error) {
      logTest('Get Provider Profile', false, error.message);
    }
  }

  // Test provider availability
  if (providerId) {
    try {
      const availability = await makeRequest('GET', `/providers/${providerId}/availability`);
      logTest('Get Provider Availability', availability.success);
    } catch (error) {
      logTest('Get Provider Availability', false, error.message);
    }
  }

  // 6. BOOKING TESTS
  console.log('\n📅 BOOKING TESTS');

  // Test get bookings without auth
  try {
    const bookingsNoAuth = await makeRequest('GET', '/bookings');
    logTest('Get Bookings Without Auth', !bookingsNoAuth.success && bookingsNoAuth.status === 401);
  } catch (error) {
    logTest('Get Bookings Without Auth', false, error.message);
  }

  // 7. REVIEW TESTS
  console.log('\n⭐ REVIEW TESTS');

  // Test get provider reviews
  if (providerId) {
    try {
      const providerReviews = await makeRequest('GET', `/reviews/provider/${providerId}`);
      logTest('Get Provider Reviews', providerReviews.success);
    } catch (error) {
      logTest('Get Provider Reviews', false, error.message);
    }
  }

  // 8. CHAT TESTS
  console.log('\n💬 CHAT TESTS');

  // Test get conversations without auth
  try {
    const conversationsNoAuth = await makeRequest('GET', '/chat/conversations');
    logTest('Get Conversations Without Auth', !conversationsNoAuth.success && conversationsNoAuth.status === 401);
  } catch (error) {
    logTest('Get Conversations Without Auth', false, error.message);
  }

  // 9. NOTIFICATION TESTS
  console.log('\n🔔 NOTIFICATION TESTS');

  // Test get notifications without auth
  try {
    const notificationsNoAuth = await makeRequest('GET', '/notifications');
    logTest('Get Notifications Without Auth', !notificationsNoAuth.success && notificationsNoAuth.status === 401);
  } catch (error) {
    logTest('Get Notifications Without Auth', false, error.message);
  }

  // 10. PAYMENT TESTS
  console.log('\n💳 PAYMENT TESTS');

  // Test create payment intent without auth
  try {
    const paymentNoAuth = await makeRequest('POST', '/payments/intent', {
      bookingId: 'test-booking-id',
      amount: 100
    });
    logTest('Create Payment Intent Without Auth', !paymentNoAuth.success && paymentNoAuth.status === 401);
  } catch (error) {
    logTest('Create Payment Intent Without Auth', false, error.message);
  }

  // 11. ADMIN TESTS
  console.log('\n👑 ADMIN TESTS');

  // Test admin dashboard without auth
  try {
    const adminNoAuth = await makeRequest('GET', '/admin/dashboard');
    logTest('Admin Dashboard Without Auth', !adminNoAuth.success && adminNoAuth.status === 401);
  } catch (error) {
    logTest('Admin Dashboard Without Auth', false, error.message);
  }

  // 12. UPLOAD TESTS
  console.log('\n📤 UPLOAD TESTS');

  // Test upload without auth
  try {
    const uploadNoAuth = await makeRequest('POST', '/upload/image');
    logTest('Upload Without Auth', !uploadNoAuth.success && uploadNoAuth.status === 401);
  } catch (error) {
    logTest('Upload Without Auth', false, error.message);
  }

  // 13. INPUT VALIDATION TESTS
  console.log('\n✅ INPUT VALIDATION TESTS');

  // Test registration with invalid email
  try {
    const invalidEmail = await makeRequest('POST', '/auth/register', {
      email: 'invalid-email',
      password: TEST_PASSWORD,
      displayName: 'Test User',
      role: 'customer'
    });
    logTest('Invalid Email Validation', !invalidEmail.success && invalidEmail.status === 400);
  } catch (error) {
    logTest('Invalid Email Validation', false, error.message);
  }

  // Test registration with weak password
  try {
    const weakPassword = await makeRequest('POST', '/auth/register', {
      email: 'test2@example.com',
      password: '123',
      displayName: 'Test User',
      role: 'customer'
    });
    logTest('Weak Password Validation', !weakPassword.success && weakPassword.status === 400);
  } catch (error) {
    logTest('Weak Password Validation', false, error.message);
  }

  // Test registration with missing required fields
  try {
    const missingFields = await makeRequest('POST', '/auth/register', {
      email: 'test3@example.com'
      // Missing password, displayName, role
    });
    logTest('Missing Required Fields Validation', !missingFields.success && missingFields.status === 400);
  } catch (error) {
    logTest('Missing Required Fields Validation', false, error.message);
  }

  // 14. ERROR HANDLING TESTS
  console.log('\n🚨 ERROR HANDLING TESTS');

  // Test 404 for non-existent endpoints
  try {
    const notFound = await makeRequest('GET', '/non-existent-endpoint');
    logTest('404 Error Handling', !notFound.success && notFound.status === 404);
  } catch (error) {
    logTest('404 Error Handling', false, error.message);
  }

  // Test 404 for non-existent resources
  try {
    const notFoundResource = await makeRequest('GET', '/users/non-existent-id');
    logTest('404 Resource Not Found', !notFoundResource.success && notFoundResource.status === 404);
  } catch (error) {
    logTest('404 Resource Not Found', false, error.message);
  }

  // 15. RATE LIMITING TESTS
  console.log('\n⏱️ RATE LIMITING TESTS');

  // Test rate limiting (make multiple rapid requests)
  try {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(makeRequest('GET', '/'));
    }
    
    const responses = await Promise.all(requests);
    const allSuccessful = responses.every(r => r.success);
    logTest('Rate Limiting (10 rapid requests)', allSuccessful);
  } catch (error) {
    logTest('Rate Limiting (10 rapid requests)', false, error.message);
  }

  // FINAL RESULTS
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n🔍 FAILED TESTS DETAILS:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  
  if (testResults.failed > 0) {
    console.log('❗ Issues found that need attention:');
    console.log('   - Check Firebase emulator is running');
    console.log('   - Verify all dependencies are installed');
    console.log('   - Check environment variables are set');
    console.log('   - Review error logs for specific issues');
  } else {
    console.log('🎉 All tests passed! Backend is functioning correctly.');
  }

  console.log('\n📋 NEXT STEPS:');
  console.log('1. Fix any failing tests');
  console.log('2. Add authentication tokens for protected endpoint testing');
  console.log('3. Test with real Firebase project (not emulator)');
  console.log('4. Add integration tests with frontend');
  console.log('5. Set up automated testing pipeline');
}

// Run the test suite
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest };