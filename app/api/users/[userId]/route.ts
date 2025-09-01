import { NextRequest, NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firestore';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const userProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
  address: z.string().optional(),
  preferences: z.object({
    notifications: z.boolean().optional(),
    newsletter: z.boolean().optional(),
    smsUpdates: z.boolean().optional()
  }).optional()
});

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user can access this profile (own profile or admin)
    if (userId !== user.uid && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Cannot access other user profiles' },
        { status: 403 }
      );
    }

    const userProfile = await getDocument('users', userId);
    
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'Not found', message: 'User profile not found' },
        { status: 404 }
      );
    }

    // Remove sensitive information
    const { password, ...safeProfile } = userProfile;

    return NextResponse.json({
      success: true,
      data: safeProfile,
      message: 'User profile retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = requireAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user can update this profile (own profile only)
    if (userId !== user.uid) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Cannot update other user profiles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = userProfileSchema.parse(body);

    // Update user profile
    await updateDocument('users', userId, {
      ...validatedData,
      updatedAt: new Date().toISOString()
    });

    // Get updated profile
    const updatedProfile = await getDocument('users', userId);

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'User profile updated successfully'
    });

  } catch (error: any) {
    console.error('Update user profile error:', error);
    
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

export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user can delete this profile (own profile or admin)
    if (userId !== user.uid && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Cannot delete other user profiles' },
        { status: 403 }
      );
    }

    // Soft delete - mark as deleted instead of removing
    await updateDocument('users', userId, {
      deleted: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      data: null,
      message: 'User account deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete user profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});