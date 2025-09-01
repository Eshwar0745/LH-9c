import { NextRequest, NextResponse } from 'next/server';
import { createDocument, getDocuments, where } from '@/lib/firestore';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const reviewSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
  providerId: z.string().min(1, 'Provider ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().min(5, 'Comment must be at least 5 characters'),
  anonymous: z.boolean().optional().default(false)
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    // Check if booking exists and is completed
    const booking = await getDocuments('bookings', [
      where('id', '==', validatedData.bookingId),
      where('customerId', '==', user.uid),
      where('status', '==', 'completed')
    ]);

    if (booking.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking', message: 'Only completed bookings can be reviewed' },
        { status: 400 }
      );
    }

    // Check if review already exists for this booking
    const existingReview = await getDocuments('reviews', [
      where('bookingId', '==', validatedData.bookingId),
      where('customerId', '==', user.uid)
    ]);

    if (existingReview.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Duplicate review', message: 'You have already reviewed this booking' },
        { status: 409 }
      );
    }

    const reviewData = {
      ...validatedData,
      customerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      helpful: 0,
      reported: false
    };

    const reviewId = await createDocument('reviews', reviewData);

    // TODO: Update provider's average rating
    // This would involve calculating the new average and updating the provider document

    return NextResponse.json({
      success: true,
      data: { id: reviewId, ...reviewData },
      message: 'Review submitted successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create review error:', error);
    
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
    const serviceId = url.searchParams.get('serviceId');
    const providerId = url.searchParams.get('providerId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

    let constraints: any[] = [];

    if (serviceId) {
      constraints.push(where('serviceId', '==', serviceId));
    }

    if (providerId) {
      constraints.push(where('providerId', '==', providerId));
    }

    const reviews = await getDocuments('reviews', constraints);

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        pageSize,
        total: reviews.length,
        totalPages: Math.ceil(reviews.length / pageSize)
      },
      message: 'Reviews retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}