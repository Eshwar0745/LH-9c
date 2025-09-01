import { NextRequest, NextResponse } from 'next/server';
import { createDocument, getDocument, getDocuments, where } from '@/lib/firestore';
import { requireAuth } from '@/lib/auth-utils';
import { z } from 'zod';

const createRoomSchema = z.object({
  participantId: z.string().min(1, 'Participant ID is required'),
  bookingId: z.string().optional(),
  type: z.enum(['booking', 'general']).default('general')
});

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const validatedData = createRoomSchema.parse(body);

    // Check if a room already exists between these users
    const existingRooms = await getDocuments('chat_rooms', [
      where('participants', 'array-contains', user.uid)
    ]);

    const existingRoom = existingRooms.find(room => 
      room.participants.includes(validatedData.participantId)
    );

    if (existingRoom) {
      return NextResponse.json({
        success: true,
        data: existingRoom,
        message: 'Chat room already exists'
      });
    }

    // Create new chat room
    const roomData = {
      participants: [user.uid, validatedData.participantId],
      type: validatedData.type,
      bookingId: validatedData.bookingId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: {
        [user.uid]: 0,
        [validatedData.participantId]: 0
      }
    };

    const roomId = await createDocument('chat_rooms', roomData);

    return NextResponse.json({
      success: true,
      data: { id: roomId, ...roomData },
      message: 'Chat room created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create chat room error:', error);
    
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

    // Users can only access their own chat rooms
    if (userId !== user.uid) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', message: 'Cannot access other user chat rooms' },
        { status: 403 }
      );
    }

    const chatRooms = await getDocuments('chat_rooms', [
      where('participants', 'array-contains', userId)
    ]);

    // TODO: Populate participant details and last message info
    // In a real app, you'd join with user data to get names, avatars, etc.

    return NextResponse.json({
      success: true,
      data: chatRooms,
      message: 'Chat rooms retrieved successfully'
    });

  } catch (error: any) {
    console.error('Get chat rooms error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error', message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});