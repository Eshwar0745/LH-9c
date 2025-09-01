import { NextRequest, NextResponse } from 'next/server';
import { createDocument, getDocuments, where, orderBy, limit } from '@/lib/firestore';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const serviceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['Plumbing', 'Electrical', 'Cleaning', 'Gardening', 'Carpentry', 'Painting', 'AC Repair', 'Home Security']),
  location: z.object({
    city: z.string(),
    state: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),
  images: z.array(z.string()).optional(),
  availability: z.object({
    days: z.array(z.string()),
    hours: z.object({
      start: z.string(),
      end: z.string()
    })
  }).optional(),
  tags: z.array(z.string()).optional()
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const validatedData = serviceSchema.parse(body);

    // Only providers can create services
    if (user.role !== 'provider') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Only providers can create services' },
        { status: 403 }
      );
    }

    const serviceData = {
      ...validatedData,
      providerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      active: true,
      rating: 0,
      reviewCount: 0
    };

    const serviceId = await createDocument('services', serviceData);

    return NextResponse.json({
      success: true,
      data: { id: serviceId, ...serviceData },
      message: 'Service created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create service error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', message: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Server error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const category = url.searchParams.get('category');
    const location = url.searchParams.get('location');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    let constraints: any[] = [where('active', '==', true)];

    if (category) {
      constraints.push(where('category', '==', category));
    }

    if (location) {
      constraints.push(where('location.city', '==', location));
    }

    // Add ordering and pagination
    constraints.push(orderBy(sortBy, sortOrder as 'asc' | 'desc'));
    constraints.push(limit(pageSize));

    const services = await getDocuments('services', constraints);

    // Calculate pagination info
    const total = services.length; // In a real app, you'd get this from a separate count query
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: services,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      },
      message: 'Services retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}