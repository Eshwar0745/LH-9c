import { NextRequest, NextResponse } from 'next/server';
import { createDocument, getDocument, getDocuments, where } from '@/lib/firestore';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const bookingSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  providerId: z.string().min(1, 'Provider ID is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  address: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required')
  }),
  details: z.string().optional(),
  estimatedPrice: z.number().positive('Estimated price must be positive').optional()
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const validatedData = bookingSchema.parse(body);

    // Verify service exists
    const service = await getDocument('services', validatedData.serviceId);
    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Not found', message: 'Service not found' },
        { status: 404 }
      );
    }

    // Verify provider exists
    const provider = await getDocument('users', validatedData.providerId);
    if (!provider || provider.role !== 'provider') {
      return NextResponse.json(
        { success: false, error: 'Not found', message: 'Provider not found' },
        { status: 404 }
      );
    }

    // Check for booking conflicts (same provider, same date/time)
    const existingBookings = await getDocuments('bookings', [
      where('providerId', '==', validatedData.providerId),
      where('date', '==', validatedData.date),
      where('time', '==', validatedData.time),
      where('status', 'in', ['pending', 'accepted', 'in_progress'])
    ]);

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Conflict', message: 'Provider is not available at this time' },
        { status: 409 }
      );
    }

    const bookingData = {
      ...validatedData,
      customerId: user.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const bookingId = await createDocument('bookings', bookingData);

    return NextResponse.json({
      success: true,
      data: { id: bookingId, ...bookingData },
      message: 'Booking created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create booking error:', error);
    
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
    const status = url.searchParams.get('status');
    const customerId = url.searchParams.get('customerId');
    const providerId = url.searchParams.get('providerId');

    let constraints: any[] = [];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    if (customerId) {
      constraints.push(where('customerId', '==', customerId));
    }

    if (providerId) {
      constraints.push(where('providerId', '==', providerId));
    }

    const bookings = await getDocuments('bookings', constraints);

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        pageSize,
        total: bookings.length,
        totalPages: Math.ceil(bookings.length / pageSize)
      },
      message: 'Bookings retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}