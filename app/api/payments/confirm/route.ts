import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { updateDocument } from '@/lib/firestore';
import { z } from 'zod';

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  bookingId: z.string().min(1, 'Booking ID is required')
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const validatedData = confirmPaymentSchema.parse(body);

    // In a real implementation, you would confirm the payment with Stripe
    // For now, we'll simulate successful payment confirmation

    const paymentResult = {
      id: validatedData.paymentIntentId,
      status: 'succeeded',
      amount: 10000, // This would come from the payment intent
      currency: 'USD',
      paymentMethod: {
        id: validatedData.paymentMethodId,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242'
        }
      },
      receiptUrl: `https://pay.stripe.com/receipts/${validatedData.paymentIntentId}`,
      created: Math.floor(Date.now() / 1000)
    };

    // Update booking status to paid
    await updateDocument('bookings', validatedData.bookingId, {
      paymentStatus: 'paid',
      paymentId: validatedData.paymentIntentId,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // In a real app, you would also:
    // 1. Calculate and set aside platform commission
    // 2. Create a payout to the provider
    // 3. Send confirmation emails/notifications
    // 4. Update provider earnings

    return NextResponse.json({
      success: true,
      data: {
        payment: paymentResult,
        booking: {
          id: validatedData.bookingId,
          paymentStatus: 'paid'
        }
      },
      message: 'Payment confirmed successfully'
    });

  } catch (error: any) {
    console.error('Confirm payment error:', error);
    
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