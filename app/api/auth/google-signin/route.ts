import { NextRequest, NextResponse } from 'next/server';
import { firebaseClient, firestore } from '@/lib/firebase';
import { z } from 'zod';

const googleSigninSchema = z.object({
  role: z.enum(['customer', 'provider']).optional().default('customer'),
  businessDetails: z.object({
    experience: z.string().optional(),
    services: z.array(z.string()).optional(),
    description: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = googleSigninSchema.parse(body);

    // This endpoint expects the Google sign-in to be handled on the client side
    // and receives the user data after successful authentication
    const googleUser = await firebaseClient.signInWithGoogle();

    // Create or update user profile
    const userProfile = {
      uid: googleUser.uid,
      email: googleUser.email || '',
      name: googleUser.displayName || '',
      role: validatedData.role,
      verified: false,
      emailVerified: googleUser.emailVerified,
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

    // Get user token
    const token = await googleUser.getIdToken();

    return NextResponse.json({
      success: true,
      data: {
        user: {
          uid: googleUser.uid,
          email: googleUser.email,
          emailVerified: googleUser.emailVerified,
          displayName: googleUser.displayName
        },
        profile: userProfile,
        token
      },
      message: 'Google sign-in successful'
    });

  } catch (error: any) {
    console.error('Google sign-in error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', message: error.errors[0].message },
        { status: 400 }
      );
    }

    // Handle Firebase auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      return NextResponse.json(
        { success: false, error: 'Sign-in cancelled', message: 'Google sign-in was cancelled by user' },
        { status: 400 }
      );
    }

    if (error.code === 'auth/popup-blocked') {
      return NextResponse.json(
        { success: false, error: 'Popup blocked', message: 'Please allow popups for Google sign-in' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Google sign-in failed', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}