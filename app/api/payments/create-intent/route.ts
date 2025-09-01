import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const paymentIntentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  paymentMethodId: z.string().optional(),
  metadata: z.object({
    customerId: z.string(),
    providerId: z.string(),
    serviceId: z.string()
  }).optional()
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const validatedData = paymentIntentSchema.parse(body);

    // In a real implementation, you would integrate with Stripe or another payment processor
    // For now, we'll simulate the payment intent creation

    // Simulate payment processing
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: validatedData.amount * 100, // Convert to cents
      currency: validatedData.currency,
      status: 'requires_payment_method',
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36)}`,
      bookingId: validatedData.bookingId,
      customerId: user.uid,
      created: Math.floor(Date.now() / 1000),
      metadata: validatedData.metadata
    };

    // In a real app, you would save this to your database
    // await createDocument('payment_intents', paymentIntent);

    return NextResponse.json({
      success: true,
      data: {
        paymentIntent,
        clientSecret: paymentIntent.clientSecret
      },
      message: 'Payment intent created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create payment intent error:', error);
    
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