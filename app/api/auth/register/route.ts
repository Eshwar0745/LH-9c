import { NextRequest, NextResponse } from 'next/server';
import { firebaseClient, firestore } from '@/lib/firebase';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number and special character'
  ),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  role: z.enum(['customer', 'provider']),
  businessDetails: z.object({
    experience: z.string().optional(),
    services: z.array(z.string()).optional(),
    description: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if email already exists
    try {
      await firebaseClient.signInWithEmail(validatedData.email, validatedData.password);
      return NextResponse.json(
        { success: false, error: 'Email already registered', message: 'An account with this email already exists' },
        { status: 400 }
      );
    } catch (error: any) {
      // Email doesn't exist, proceed with registration
      if (!error.message.includes('user-not-found') && !error.message.includes('wrong-password')) {
        throw error;
      }
    }

    // Create user account
    const user = await firebaseClient.signUpWithEmail(validatedData.email, validatedData.password);

    // Send email verification
    await firebaseClient.sendEmailVerificationLink(user);

    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: validatedData.email,
      name: validatedData.name,
      phone: validatedData.phone,
      role: validatedData.role,
      verified: false,
      emailVerified: false,
      ...(validatedData.role === 'provider' && validatedData.businessDetails && {
        experience: validatedData.businessDetails.experience || '',
        services: validatedData.businessDetails.services || [],
        description: validatedData.businessDetails.description || '',
        portfolio: [],
        availability: {},
        rating: 0,
        reviewsCount: 0
      })
    };

    await firestore.upsertUserProfile(userProfile);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified
        },
        profile: userProfile
      },
      message: 'Registration successful. Please check your email for verification.'
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', message: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Registration failed', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}