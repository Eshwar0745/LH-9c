"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface TestReport {
  testSuites: TestSuite[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  timestamp: string;
  environment: {
    baseUrl: string;
    nodeEnv: string;
  };
}

export default function TestDashboard() {
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const runTests = async (suite?: string) => {
    setLoading(true);
    try {
      const url = suite ? `/api/test?suite=${suite}` : '/api/test';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setTestReport(data.data);
      } else {
        console.error('Test failed:', data.error);
      }
    } catch (error) {
      console.error('Failed to run tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'bg-green-500';
      case 'FAIL': return 'bg-red-500';
      case 'SKIP': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'PASS': return 'default';
      case 'FAIL': return 'destructive';
      case 'SKIP': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Local Hands API Test Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive testing for all backend endpoints and functionality
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button 
            onClick={() => runTests()} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </Button>
          <Button 
            onClick={() => runTests('auth')} 
            disabled={loading}
            variant="outline"
          >
            Test Auth
          </Button>
          <Button 
            onClick={() => runTests('users')} 
            disabled={loading}
            variant="outline"
          >
            Test Users
          </Button>
          <Button 
            onClick={() => runTests('services')} 
            disabled={loading}
            variant="outline"
          >
            Test Services
          </Button>
          <Button 
            onClick={() => runTests('bookings')} 
            disabled={loading}
            variant="outline"
          >
            Test Bookings
          </Button>
        </div>

        {testReport && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-gray-900">
                    {testReport.summary.total}
                  </div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">
                    {testReport.summary.passed}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-red-600">
                    {testReport.summary.failed}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-yellow-600">
                    {testReport.summary.skipped}
                  </div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            <Card>
              <CardContent className="p-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span>Test Progress</span>
                  <span>
                    {Math.round((testReport.summary.passed / testReport.summary.total) * 100)}% Passed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(testReport.summary.passed / testReport.summary.total) * 100}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* Test Suites */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {testReport.testSuites.map((suite, index) => (
                  <TabsTrigger key={index} value={suite.name}>
                    {suite.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-4">
                  {testReport.testSuites.map((suite, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          <span>{suite.name}</span>
                          <div className="flex gap-2">
                            <Badge variant={getStatusBadgeVariant('PASS')}>
                              {suite.summary.passed} Passed
                            </Badge>
                            <Badge variant={getStatusBadgeVariant('FAIL')}>
                              {suite.summary.failed} Failed
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {suite.tests.map((test, testIndex) => (
                            <div
                              key={testIndex}
                              className="flex items-center gap-2 p-2 rounded bg-gray-50"
                            >
                              <div
                                className={`w-3 h-3 rounded-full ${getStatusColor(test.status)}`}
                              ></div>
                              <span className="text-sm font-mono">
                                {test.method} {test.endpoint}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {testReport.testSuites.map((suite, index) => (
                <TabsContent key={index} value={suite.name}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{suite.name} - Detailed Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {suite.tests.map((test, testIndex) => (
                          <div
                            key={testIndex}
                            className={`p-4 rounded border-l-4 ${
                              test.status === 'PASS' ? 'border-green-500 bg-green-50' :
                              test.status === 'FAIL' ? 'border-red-500 bg-red-50' :
                              'border-yellow-500 bg-yellow-50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-mono font-medium">
                                  {test.method} {test.endpoint}
                                </span>
                                <Badge 
                                  variant={getStatusBadgeVariant(test.status)}
                                  className="ml-2"
                                >
                                  {test.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                {test.responseTime}ms
                              </div>
                            </div>
                            <div className="flex gap-4 text-sm">
                              <span>Expected: {test.expectedStatus}</span>
                              <span>Actual: {test.actualStatus}</span>
                            </div>
                            {test.error && (
                              <div className="mt-2 p-2 bg-white rounded text-sm text-red-700">
                                {test.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Environment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Test Environment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Base URL:</span>
                    <div className="text-gray-600">{testReport.environment.baseUrl}</div>
                  </div>
                  <div>
                    <span className="font-medium">Environment:</span>
                    <div className="text-gray-600">{testReport.environment.nodeEnv}</div>
                  </div>
                  <div>
                    <span className="font-medium">Test Time:</span>
                    <div className="text-gray-600">
                      {new Date(testReport.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!testReport && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500 mb-4">
                No test results yet. Click "Run All Tests" to start testing.
              </div>
              <Button onClick={() => runTests()}>
                Run All Tests
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}