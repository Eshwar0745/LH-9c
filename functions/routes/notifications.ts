import express from 'express';
import * as admin from 'firebase-admin';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import { asyncHandler, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { NotificationModel, createApiResponse, createPaginatedResponse } from '../models/firestore';

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get('/', 
  authenticate,
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { page = 1, limit = 20, unreadOnly } = req.query;
    const userId = req.user.uid;

    let notifications = await NotificationModel.findByUser(userId, Number(limit));

    // Filter for unread only if requested
    if (unreadOnly === 'true') {
      notifications = notifications.filter(notification => !notification.isRead);
    }

    // Apply pagination
    const total = notifications.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedNotifications = notifications.slice(startIndex, startIndex + Number(limit));

    const response = createPaginatedResponse(paginatedNotifications, Number(page), Number(limit), total);
    res.json(response);
  })
);

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put('/:notificationId/read', 
  authenticate,
  asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    // Verify notification exists and belongs to user
    const notification = await NotificationModel.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== req.user.uid) {
      throw new ForbiddenError('Access denied');
    }

    await NotificationModel.markAsRead(notificationId);

    res.json(createApiResponse(true, null, 'Notification marked as read'));
  })
);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', 
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    await NotificationModel.markAllAsRead(req.user.uid);

    res.json(createApiResponse(true, null, 'All notifications marked as read'));
  })
);

// POST /api/notifications/send - Send notification (admin only)
router.post('/send', 
  authenticate,
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    const { userId, type, title, message, data } = req.body;

    if (!userId || !type || !title || !message) {
      throw new Error('Missing required fields');
    }

    const notification = await NotificationModel.create({
      userId,
      type,
      title,
      message,
      data
    });

    res.status(201).json(createApiResponse(true, notification, 'Notification sent successfully'));
  })
);

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', 
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const notifications = await NotificationModel.findByUser(req.user.uid);
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      byType: notifications.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json(createApiResponse(true, stats, 'Notification statistics retrieved successfully'));
  })
);

export default router;