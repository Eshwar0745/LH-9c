import { NextRequest, NextResponse } from 'next/server';
import { firebaseClient } from '@/lib/firebase';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    // Send password reset email
    await firebaseClient.sendPasswordReset(validatedData.email);

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Password reset email sent successfully. Please check your inbox.'
    });

  } catch (error: any) {
    console.error('Password reset error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', message: error.errors[0].message },
        { status: 400 }
      );
    }

    // Handle Firebase auth errors
    if (error.code === 'auth/user-not-found') {
      // For security reasons, we don't reveal if the email exists or not
      return NextResponse.json({
        success: true,
        data: null,
        message: 'If an account with this email exists, a password reset email has been sent.'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Password reset failed', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}