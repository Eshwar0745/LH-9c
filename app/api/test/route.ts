import { NextRequest, NextResponse } from 'next/server';

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  statusCode?: number;
  responseTime?: number;
  error?: string;
  expectedStatus?: number;
  actualStatus?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

class APITester {
  private results: TestResult[] = [];

  async testEndpoint(
    endpoint: string, 
    method: string, 
    body?: any, 
    headers?: Record<string, string>,
    expectedStatus: number = 200
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const responseTime = Date.now() - startTime;
      const status = response.status === expectedStatus ? 'PASS' : 'FAIL';

      const result: TestResult = {
        endpoint,
        method,
        status,
        statusCode: response.status,
        responseTime,
        expectedStatus,
        actualStatus: response.status
      };

      if (status === 'FAIL') {
        result.error = `Expected status ${expectedStatus}, got ${response.status}`;
      }

      this.results.push(result);
      return result;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        endpoint,
        method,
        status: 'FAIL',
        responseTime,
        error: error.message,
        expectedStatus,
        actualStatus: 0
      };
      
      this.results.push(result);
      return result;
    }
  }

  getResults(): TestResult[] {
    return this.results;
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    return { total, passed, failed, skipped };
  }

  clear() {
    this.results = [];
  }
}

const tester = new APITester();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const suiteParam = url.searchParams.get('suite');
    
    tester.clear();

    const testSuites: TestSuite[] = [];

    // Authentication Endpoints Testing
    if (!suiteParam || suiteParam === 'auth') {
      console.log('Testing Authentication Endpoints...');
      
      // Test user registration
      await tester.testEndpoint('/api/auth/register', 'POST', {
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: 'Test User',
        phone: '1234567890',
        role: 'customer'
      }, {}, 200);

      // Test invalid registration (weak password)
      await tester.testEndpoint('/api/auth/register', 'POST', {
        email: 'test2@example.com',
        password: 'weak',
        name: 'Test User',
        phone: '1234567890',
        role: 'customer'
      }, {}, 400);

      // Test user login
      await tester.testEndpoint('/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'TestPassword123!'
      }, {}, 200);

      // Test invalid login
      await tester.testEndpoint('/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'wrongpassword'
      }, {}, 401);

      // Test password reset
      await tester.testEndpoint('/api/auth/reset-password', 'POST', {
        email: 'test@example.com'
      }, {}, 200);

      const authResults = tester.getResults();
      testSuites.push({
        name: 'Authentication Endpoints',
        tests: authResults,
        summary: tester.getSummary()
      });

      tester.clear();
    }

    // User Management Endpoints Testing
    if (!suiteParam || suiteParam === 'users') {
      console.log('Testing User Management Endpoints...');

      // Test get user profile (requires auth)
      await tester.testEndpoint('/api/users/test-user-id', 'GET', undefined, {
        'Authorization': 'Bearer fake-token'
      }, 401); // Should fail without proper auth

      // Test update user profile (requires auth)
      await tester.testEndpoint('/api/users/test-user-id', 'PUT', {
        name: 'Updated Name',
        phone: '9876543210'
      }, {
        'Authorization': 'Bearer fake-token'
      }, 401); // Should fail without proper auth

      const userResults = tester.getResults().slice(testSuites.length > 0 ? testSuites[0].tests.length : 0);
      testSuites.push({
        name: 'User Management Endpoints',
        tests: userResults,
        summary: {
          total: userResults.length,
          passed: userResults.filter(r => r.status === 'PASS').length,
          failed: userResults.filter(r => r.status === 'FAIL').length,
          skipped: userResults.filter(r => r.status === 'SKIP').length
        }
      });
    }

    // Service Management Endpoints Testing
    if (!suiteParam || suiteParam === 'services') {
      console.log('Testing Service Management Endpoints...');

      // Test get services (public endpoint)
      await tester.testEndpoint('/api/services', 'GET', undefined, {}, 200);

      // Test get services with filters
      await tester.testEndpoint('/api/services?category=Plumbing&location=Bengaluru', 'GET', undefined, {}, 200);

      // Test create service (requires auth)
      await tester.testEndpoint('/api/services', 'POST', {
        title: 'Professional Plumbing Service',
        description: 'Expert plumbing repairs and installations',
        price: 100,
        category: 'Plumbing',
        location: {
          city: 'Bengaluru',
          state: 'Karnataka'
        }
      }, {
        'Authorization': 'Bearer fake-token'
      }, 401); // Should fail without proper auth

      const serviceResults = tester.getResults().slice(
        testSuites.reduce((acc, suite) => acc + suite.tests.length, 0)
      );
      testSuites.push({
        name: 'Service Management Endpoints',
        tests: serviceResults,
        summary: {
          total: serviceResults.length,
          passed: serviceResults.filter(r => r.status === 'PASS').length,
          failed: serviceResults.filter(r => r.status === 'FAIL').length,
          skipped: serviceResults.filter(r => r.status === 'SKIP').length
        }
      });
    }

    // Booking System Endpoints Testing
    if (!suiteParam || suiteParam === 'bookings') {
      console.log('Testing Booking System Endpoints...');

      // Test get bookings (public endpoint with filters)
      await tester.testEndpoint('/api/bookings', 'GET', undefined, {}, 200);

      // Test create booking (requires auth)
      await tester.testEndpoint('/api/bookings', 'POST', {
        serviceId: 'test-service-id',
        providerId: 'test-provider-id',
        date: '2024-01-15',
        time: '10:00',
        address: {
          line1: '123 Test Street',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001'
        },
        details: 'Kitchen sink repair needed'
      }, {
        'Authorization': 'Bearer fake-token'
      }, 401); // Should fail without proper auth

      const bookingResults = tester.getResults().slice(
        testSuites.reduce((acc, suite) => acc + suite.tests.length, 0)
      );
      testSuites.push({
        name: 'Booking System Endpoints',
        tests: bookingResults,
        summary: {
          total: bookingResults.length,
          passed: bookingResults.filter(r => r.status === 'PASS').length,
          failed: bookingResults.filter(r => r.status === 'FAIL').length,
          skipped: bookingResults.filter(r => r.status === 'SKIP').length
        }
      });
    }

    // Calculate overall summary
    const overallSummary = testSuites.reduce(
      (acc, suite) => ({
        total: acc.total + suite.summary.total,
        passed: acc.passed + suite.summary.passed,
        failed: acc.failed + suite.summary.failed,
        skipped: acc.skipped + suite.summary.skipped
      }),
      { total: 0, passed: 0, failed: 0, skipped: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        testSuites,
        summary: overallSummary,
        timestamp: new Date().toISOString(),
        environment: {
          baseUrl: BASE_URL,
          nodeEnv: process.env.NODE_ENV
        }
      },
      message: 'API testing completed'
    });

  } catch (error: any) {
    console.error('API testing error:', error);
    return NextResponse.json(
      { success: false, error: 'Testing failed', message: error.message },
      { status: 500 }
    );
  }
}