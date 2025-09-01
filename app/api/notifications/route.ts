import { NextRequest, NextResponse } from 'next/server';
import { createDocument, getDocuments, where, orderBy } from '@/lib/firestore';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const notificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['booking', 'payment', 'review', 'message', 'system', 'promotion']),
  data: z.object({
    bookingId: z.string().optional(),
    serviceId: z.string().optional(),
    chatRoomId: z.string().optional(),
    actionUrl: z.string().optional()
  }).optional()
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const validatedData = notificationSchema.parse(body);

    // Only allow users to send notifications to themselves or admins to send to anyone
    if (validatedData.userId !== user.uid && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Cannot send notifications to other users' },
        { status: 403 }
      );
    }

    const notificationData = {
      ...validatedData,
      read: false,
      createdAt: new Date().toISOString(),
      readAt: null
    };

    const notificationId = await createDocument('notifications', notificationData);

    // TODO: Send push notification via Firebase Cloud Messaging
    // This would involve sending the notification to the user's device

    return NextResponse.json({
      success: true,
      data: { id: notificationId, ...notificationData },
      message: 'Notification sent successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Send notification error:', error);
    
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

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || user.uid;
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    // Users can only access their own notifications, admins can access any
    if (userId !== user.uid && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Cannot access other user notifications' },
        { status: 403 }
      );
    }

    let constraints: any[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ];

    if (unreadOnly) {
      constraints.push(where('read', '==', false));
    }

    const notifications = await getDocuments('notifications', constraints);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        pageSize,
        total: notifications.length,
        totalPages: Math.ceil(notifications.length / pageSize)
      },
      message: 'Notifications retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});