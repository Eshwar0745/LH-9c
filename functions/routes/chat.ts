import express from 'express';
import * as admin from 'firebase-admin';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import { asyncHandler, NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler';
import { ConversationModel, MessageModel, UserModel, NotificationModel, createApiResponse } from '../models/firestore';
import { Conversation, Message } from '../models/types';

const router = express.Router();

// POST /api/chat/conversations - Create or get conversation
router.post('/conversations', 
  authenticate,
  validate(schemas.messageCreate),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { receiverId, bookingId } = req.body;
    const senderId = req.user.uid;

    if (!receiverId) {
      throw new ValidationError('Receiver ID is required');
    }

    if (senderId === receiverId) {
      throw new ValidationError('Cannot create conversation with yourself');
    }

    // Verify receiver exists
    const receiver = await UserModel.findById(receiverId);
    if (!receiver) {
      throw new NotFoundError('Receiver not found');
    }

    // Check for existing conversation
    const participantIds = [senderId, receiverId].sort();
    let conversation = await ConversationModel.findByParticipants(participantIds);

    if (!conversation) {
      // Create new conversation
      const sender = await UserModel.findById(senderId);
      
      const conversationData: Partial<Conversation> = {
        participantIds,
        participants: [
          {
            userId: senderId,
            displayName: sender!.displayName,
            photoURL: sender!.photoURL,
            role: sender!.role as 'customer' | 'provider',
            unreadCount: 0
          },
          {
            userId: receiverId,
            displayName: receiver.displayName,
            photoURL: receiver.photoURL,
            role: receiver.role as 'customer' | 'provider',
            unreadCount: 0
          }
        ],
        bookingId
      };

      conversation = await ConversationModel.create(conversationData);
    }

    res.status(201).json(createApiResponse(true, conversation, 'Conversation created successfully'));
  })
);

// GET /api/chat/conversations - Get user's conversations
router.get('/conversations', 
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const conversations = await ConversationModel.findByUser(req.user.uid);

    res.json(createApiResponse(true, conversations, 'Conversations retrieved successfully'));
  })
);

// POST /api/chat/messages - Send message
router.post('/messages', 
  authenticate,
  validate(schemas.messageCreate),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { conversationId, receiverId, content, type = 'text' } = req.body;
    const senderId = req.user.uid;

    let conversation: Conversation | null = null;

    if (conversationId) {
      // Use existing conversation
      conversation = await ConversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found');
      }

      // Verify user is participant
      if (!conversation.participantIds.includes(senderId)) {
        throw new ForbiddenError('Access denied to this conversation');
      }
    } else if (receiverId) {
      // Create or find conversation
      const participantIds = [senderId, receiverId].sort();
      conversation = await ConversationModel.findByParticipants(participantIds);

      if (!conversation) {
        // Create new conversation
        const [sender, receiver] = await Promise.all([
          UserModel.findById(senderId),
          UserModel.findById(receiverId)
        ]);

        if (!receiver) {
          throw new NotFoundError('Receiver not found');
        }

        const conversationData: Partial<Conversation> = {
          participantIds,
          participants: [
            {
              userId: senderId,
              displayName: sender!.displayName,
              photoURL: sender!.photoURL,
              role: sender!.role as 'customer' | 'provider',
              unreadCount: 0
            },
            {
              userId: receiverId,
              displayName: receiver.displayName,
              photoURL: receiver.photoURL,
              role: receiver.role as 'customer' | 'provider',
              unreadCount: 0
            }
          ]
        };

        conversation = await ConversationModel.create(conversationData);
      }
    } else {
      throw new ValidationError('Either conversationId or receiverId is required');
    }

    // Create message
    const messageData: Partial<Message> = {
      conversationId: conversation.id,
      senderId,
      content,
      type
    };

    const message = await MessageModel.create(messageData);

    // Update conversation with last message
    await ConversationModel.updateLastMessage(conversation.id, message);

    // Send notification to other participants
    const otherParticipants = conversation.participantIds.filter(id => id !== senderId);
    for (const participantId of otherParticipants) {
      await NotificationModel.create({
        userId: participantId,
        type: 'message_received',
        title: 'New Message',
        message: `You have a new message`,
        data: { 
          conversationId: conversation.id, 
          messageId: message.id,
          senderId 
        }
      });
    }

    res.status(201).json(createApiResponse(true, message, 'Message sent successfully'));
  })
);

// GET /api/chat/messages/:conversationId - Get conversation messages
router.get('/messages/:conversationId', 
  authenticate,
  asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { limit = 50 } = req.query;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    // Verify conversation exists and user has access
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (!conversation.participantIds.includes(req.user.uid)) {
      throw new ForbiddenError('Access denied to this conversation');
    }

    const messages = await MessageModel.findByConversation(conversationId, Number(limit));

    res.json(createApiResponse(true, messages.reverse(), 'Messages retrieved successfully'));
  })
);

// PUT /api/chat/messages/:messageId/read - Mark message as read
router.put('/messages/:messageId/read', 
  authenticate,
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    // Verify message exists and user has access
    const message = await MessageModel.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    const conversation = await ConversationModel.findById(message.conversationId);
    if (!conversation || !conversation.participantIds.includes(req.user.uid)) {
      throw new ForbiddenError('Access denied');
    }

    // Only mark as read if user is not the sender
    if (message.senderId !== req.user.uid) {
      await MessageModel.markAsRead(messageId);
    }

    res.json(createApiResponse(true, null, 'Message marked as read'));
  })
);

// GET /api/chat/conversations/:conversationId - Get conversation details
router.get('/conversations/:conversationId', 
  authenticate,
  asyncHandler(async (req, res) => {
    const { conversationId } = req.params;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    if (!conversation.participantIds.includes(req.user.uid)) {
      throw new ForbiddenError('Access denied to this conversation');
    }

    res.json(createApiResponse(true, conversation, 'Conversation details retrieved successfully'));
  })
);

export default router;
