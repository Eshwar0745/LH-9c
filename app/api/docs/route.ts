import { NextRequest, NextResponse } from 'next/server';

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  authentication: 'none' | 'required' | 'admin';
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  requestBody?: {
    contentType: string;
    schema: any;
  };
  responses: {
    status: number;
    description: string;
    example: any;
  }[];
}

interface APICategory {
  name: string;
  description: string;
  endpoints: APIEndpoint[];
}

export async function GET(request: NextRequest) {
  const apiDocumentation: APICategory[] = [
    {
      name: 'Authentication',
      description: 'User registration, login, and authentication management',
      endpoints: [
        {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register a new user account (customer or provider)',
          authentication: 'none',
          requestBody: {
            contentType: 'application/json',
            schema: {
              email: 'string (email format)',
              password: 'string (min 8 chars, complex)',
              name: 'string (min 2 chars)',
              phone: 'string (min 10 digits)',
              role: 'customer | provider',
              businessDetails: 'object (optional, for providers)'
            }
          },
          responses: [
            {
              status: 200,
              description: 'Registration successful',
              example: {
                success: true,
                data: { user: {}, profile: {} },
                message: 'Registration successful. Please check your email for verification.'
              }
            },
            {
              status: 400,
              description: 'Validation failed or email already exists',
              example: {
                success: false,
                error: 'Validation failed',
                message: 'Password must contain uppercase, lowercase, number and special character'
              }
            }
          ]
        },
        {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login with email and password',
          authentication: 'none',
          requestBody: {
            contentType: 'application/json',
            schema: {
              email: 'string (email format)',
              password: 'string'
            }
          },
          responses: [
            {
              status: 200,
              description: 'Login successful',
              example: {
                success: true,
                data: { user: {}, token: 'jwt-token' },
                message: 'Login successful'
              }
            },
            {
              status: 401,
              description: 'Invalid credentials or email not verified',
              example: {
                success: false,
                error: 'Invalid credentials',
                message: 'Invalid email or password'
              }
            }
          ]
        },
        {
          method: 'POST',
          path: '/api/auth/reset-password',
          description: 'Send password reset email',
          authentication: 'none',
          requestBody: {
            contentType: 'application/json',
            schema: {
              email: 'string (email format)'
            }
          },
          responses: [
            {
              status: 200,
              description: 'Reset email sent',
              example: {
                success: true,
                data: null,
                message: 'Password reset email sent successfully. Please check your inbox.'
              }
            }
          ]
        }
      ]
    },
    {
      name: 'User Management',
      description: 'User profile management and provider verification',
      endpoints: [
        {
          method: 'GET',
          path: '/api/users/{userId}',
          description: 'Get user profile information',
          authentication: 'required',
          parameters: [
            {
              name: 'userId',
              type: 'string',
              required: true,
              description: 'User ID to fetch profile for'
            }
          ],
          responses: [
            {
              status: 200,
              description: 'Profile retrieved successfully',
              example: {
                success: true,
                data: { uid: 'user-id', name: 'John Doe', email: 'john@example.com' },
                message: 'User profile retrieved successfully'
              }
            },
            {
              status: 403,
              description: 'Cannot access other user profiles',
              example: {
                success: false,
                error: 'Forbidden',
                message: 'Cannot access other user profiles'
              }
            }
          ]
        },
        {
          method: 'PUT',
          path: '/api/users/{userId}',
          description: 'Update user profile information',
          authentication: 'required',
          parameters: [
            {
              name: 'userId',
              type: 'string',
              required: true,
              description: 'User ID to update'
            }
          ],
          requestBody: {
            contentType: 'application/json',
            schema: {
              name: 'string (optional)',
              phone: 'string (optional)',
              address: 'string (optional)',
              preferences: 'object (optional)'
            }
          },
          responses: [
            {
              status: 200,
              description: 'Profile updated successfully',
              example: {
                success: true,
                data: { uid: 'user-id', name: 'Updated Name' },
                message: 'User profile updated successfully'
              }
            }
          ]
        }
      ]
    },
    {
      name: 'Service Management',
      description: 'CRUD operations for service listings with search and filtering',
      endpoints: [
        {
          method: 'GET',
          path: '/api/services',
          description: 'Get all services with optional filtering',
          authentication: 'none',
          parameters: [
            { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
            { name: 'pageSize', type: 'number', required: false, description: 'Items per page (default: 10)' },
            { name: 'category', type: 'string', required: false, description: 'Filter by service category' },
            { name: 'location', type: 'string', required: false, description: 'Filter by city' },
            { name: 'sortBy', type: 'string', required: false, description: 'Sort field (default: createdAt)' },
            { name: 'sortOrder', type: 'string', required: false, description: 'Sort order: asc|desc (default: desc)' }
          ],
          responses: [
            {
              status: 200,
              description: 'Services retrieved successfully',
              example: {
                success: true,
                data: [{ id: 'service-id', title: 'Plumbing Service', price: 100 }],
                pagination: { page: 1, pageSize: 10, total: 50, totalPages: 5 },
                message: 'Services retrieved successfully'
              }
            }
          ]
        },
        {
          method: 'POST',
          path: '/api/services',
          description: 'Create a new service listing (providers only)',
          authentication: 'required',
          requestBody: {
            contentType: 'application/json',
            schema: {
              title: 'string (min 3 chars)',
              description: 'string (min 10 chars)',
              price: 'number (positive)',
              category: 'Plumbing | Electrical | Cleaning | Gardening | Carpentry | Painting | AC Repair | Home Security',
              location: 'object { city, state, coordinates? }',
              images: 'string[] (optional)',
              availability: 'object (optional)',
              tags: 'string[] (optional)'
            }
          },
          responses: [
            {
              status: 201,
              description: 'Service created successfully',
              example: {
                success: true,
                data: { id: 'new-service-id', title: 'Professional Plumbing', providerId: 'provider-id' },
                message: 'Service created successfully'
              }
            },
            {
              status: 403,
              description: 'Only providers can create services',
              example: {
                success: false,
                error: 'Forbidden',
                message: 'Only providers can create services'
              }
            }
          ]
        }
      ]
    },
    {
      name: 'Booking System',
      description: 'Booking lifecycle management with status tracking',
      endpoints: [
        {
          method: 'POST',
          path: '/api/bookings',
          description: 'Create a new service booking',
          authentication: 'required',
          requestBody: {
            contentType: 'application/json',
            schema: {
              serviceId: 'string',
              providerId: 'string',
              date: 'string (YYYY-MM-DD)',
              time: 'string (HH:MM)',
              address: 'object { line1, line2?, city, state, postalCode }',
              details: 'string (optional)',
              estimatedPrice: 'number (optional)'
            }
          },
          responses: [
            {
              status: 201,
              description: 'Booking created successfully',
              example: {
                success: true,
                data: { id: 'booking-id', status: 'pending', customerId: 'customer-id' },
                message: 'Booking created successfully'
              }
            },
            {
              status: 409,
              description: 'Provider not available at requested time',
              example: {
                success: false,
                error: 'Conflict',
                message: 'Provider is not available at this time'
              }
            }
          ]
        },
        {
          method: 'GET',
          path: '/api/bookings',
          description: 'Get bookings with optional filtering',
          authentication: 'none',
          parameters: [
            { name: 'page', type: 'number', required: false, description: 'Page number' },
            { name: 'pageSize', type: 'number', required: false, description: 'Items per page' },
            { name: 'status', type: 'string', required: false, description: 'Filter by booking status' },
            { name: 'customerId', type: 'string', required: false, description: 'Filter by customer' },
            { name: 'providerId', type: 'string', required: false, description: 'Filter by provider' }
          ],
          responses: [
            {
              status: 200,
              description: 'Bookings retrieved successfully',
              example: {
                success: true,
                data: [{ id: 'booking-id', status: 'pending', date: '2024-01-15' }],
                pagination: { page: 1, pageSize: 10, total: 25, totalPages: 3 },
                message: 'Bookings retrieved successfully'
              }
            }
          ]
        }
      ]
    },
    {
      name: 'Testing',
      description: 'Comprehensive API testing and validation',
      endpoints: [
        {
          method: 'GET',
          path: '/api/test',
          description: 'Run comprehensive API tests',
          authentication: 'none',
          parameters: [
            { name: 'suite', type: 'string', required: false, description: 'Test specific suite: auth|users|services|bookings' }
          ],
          responses: [
            {
              status: 200,
              description: 'API testing completed',
              example: {
                success: true,
                data: {
                  testSuites: [],
                  summary: { total: 25, passed: 23, failed: 2, skipped: 0 },
                  timestamp: '2024-01-15T10:30:00Z'
                },
                message: 'API testing completed'
              }
            }
          ]
        }
      ]
    }
  ];

  return NextResponse.json({
    success: true,
    data: {
      title: 'Local Hands API Documentation',
      version: '1.0.0',
      description: 'Comprehensive backend API for Local Hands marketplace platform',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      authentication: {
        type: 'Bearer Token (JWT)',
        header: 'Authorization: Bearer <token>',
        note: 'Include the JWT token received from login endpoint'
      },
      categories: apiDocumentation,
      endpoints: apiDocumentation.reduce((total, category) => total + category.endpoints.length, 0)
    },
    message: 'API documentation retrieved successfully'
  });
}