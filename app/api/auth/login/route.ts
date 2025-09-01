import { NextRequest, NextResponse } from 'next/server';
import { firebaseClient } from '@/lib/firebase';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Authenticate user
    const user = await firebaseClient.signInWithEmail(validatedData.email, validatedData.password);

    // Check email verification
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email not verified', 
          message: 'Please verify your email before signing in.',
          emailVerified: false
        },
        { status: 401 }
      );
    }

    // Get user token
    const token = await user.getIdToken();

    return NextResponse.json({
      success: true,
      data: {
        user: {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName
        },
        token
      },
      message: 'Login successful'
    });

  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', message: error.errors[0].message },
        { status: 400 }
      );
    }

    // Handle Firebase auth errors
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials', message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (error.code === 'auth/too-many-requests') {
      return NextResponse.json(
        { success: false, error: 'Too many attempts', message: 'Too many failed login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Login failed', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}