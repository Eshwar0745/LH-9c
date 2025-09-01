import express from 'express';
import * as admin from 'firebase-admin';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { 
  UserModel, 
  ServiceModel, 
  BookingModel, 
  ReviewModel, 
  DisputeModel,
  createApiResponse,
  createPaginatedResponse 
} from '../models/firestore';

const router = express.Router();

// GET /api/admin/dashboard - Get admin dashboard data
router.get('/dashboard', 
  authenticate,
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    // Get platform statistics
    const [users, providers, services, bookings] = await Promise.all([
      UserModel.getProviders({}), // Get all users
      UserModel.getProviders({ role: 'provider' }),
      ServiceModel.search({}),
      // BookingModel.findAll() // Would need to implement this
    ]);

    const stats = {
      totalUsers: users.length,
      totalProviders: providers.length,
      totalCustomers: users.length - providers.length,
      totalServices: services.length,
      activeServices: services.filter(s => s.isActive).length,
      totalBookings: 0, // Would calculate from bookings
      totalRevenue: 0, // Would calculate from completed bookings
      verifiedProviders: providers.filter(p => p.isVerified).length,
      pendingVerifications: providers.filter(p => !p.isVerified).length
    };

    // Get recent activity (simplified)
    const recentActivity = [
      {
        id: '1',
        type: 'user_registration',
        description: 'New user registered',
        createdAt: admin.firestore.Timestamp.now()
      }
    ];

    const dashboardData = {
      stats,
      recentActivity,
      topProviders: providers.slice(0, 5),
      topServices: services.slice(0, 5)
    };

    res.json(createApiResponse(true, dashboardData, 'Dashboard data retrieved successfully'));
  })
);

// GET /api/admin/users - Get all users with filters
router.get('/users', 
  authenticate,
  authorizeRoles('admin'),
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, isVerified, isActive, search } = req.query;

    const filters: any = {};
    if (role) filters.role = role;
    if (isVerified !== undefined) filters.isVerified = isVerified === 'true';
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    let users = await UserModel.getProviders(filters);

    // Apply search filter
    if (search) {
      const searchTerm = String(search).toLowerCase();
      users = users.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const total = users.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedUsers = users.slice(startIndex, startIndex + Number(limit));

    const response = createPaginatedResponse(paginatedUsers, Number(page), Number(limit), total);
    res.json(response);
  })
);

// PUT /api/admin/users/:userId/verify - Verify/unverify user
router.put('/users/:userId/verify', 
  authenticate,
  authorizeRoles('admin'),
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isVerified, verificationNotes } = req.body;

    if (typeof isVerified !== 'boolean') {
      throw new ValidationError('isVerified must be a boolean');
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updates: any = { isVerified };
    if (verificationNotes) updates.verificationNotes = verificationNotes;

    const updatedUser = await UserModel.update(userId, updates);

    res.json(createApiResponse(true, updatedUser, 'User verification status updated successfully'));
  })
);

// PUT /api/admin/users/:userId/suspend - Suspend/unsuspend user
router.put('/users/:userId/suspend', 
  authenticate,
  authorizeRoles('admin'),
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isActive, suspensionReason } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new ValidationError('isActive must be a boolean');
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updates: any = { isActive };
    if (suspensionReason) updates.suspensionReason = suspensionReason;

    const updatedUser = await UserModel.update(userId, updates);

    res.json(createApiResponse(true, updatedUser, 'User status updated successfully'));
  })
);

// GET /api/admin/services - Get all services with filters
router.get('/services', 
  authenticate,
  authorizeRoles('admin'),
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, category, isActive, providerId } = req.query;

    const filters: any = {};
    if (category) filters.category = category;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (providerId) filters.providerId = providerId;

    let services = await ServiceModel.search(filters);

    // Apply pagination
    const total = services.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedServices = services.slice(startIndex, startIndex + Number(limit));

    const response = createPaginatedResponse(paginatedServices, Number(page), Number(limit), total);
    res.json(response);
  })
);

// PUT /api/admin/services/:serviceId/status - Update service status
router.put('/services/:serviceId/status', 
  authenticate,
  authorizeRoles('admin'),
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { serviceId } = req.params;
    const { isActive, moderationNotes } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new ValidationError('isActive must be a boolean');
    }

    const service = await ServiceModel.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service not found');
    }

    const updates: any = { isActive };
    if (moderationNotes) updates.moderationNotes = moderationNotes;

    const updatedService = await ServiceModel.update(serviceId, updates);

    res.json(createApiResponse(true, updatedService, 'Service status updated successfully'));
  })
);

// GET /api/admin/disputes - Get all disputes
router.get('/disputes', 
  authenticate,
  authorizeRoles('admin'),
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, priority } = req.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const disputes = await DisputeModel.findAll(filters);

    // Apply pagination
    const total = disputes.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedDisputes = disputes.slice(startIndex, startIndex + Number(limit));

    const response = createPaginatedResponse(paginatedDisputes, Number(page), Number(limit), total);
    res.json(response);
  })
);

// PUT /api/admin/disputes/:disputeId/resolve - Resolve dispute
router.put('/disputes/:disputeId/resolve', 
  authenticate,
  authorizeRoles('admin'),
  validate(schemas.mongoId, 'params'),
  validate(schemas.disputeUpdate),
  asyncHandler(async (req, res) => {
    const { disputeId } = req.params;
    const updates = req.body;

    const dispute = await DisputeModel.findById(disputeId);
    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }

    const updatedDispute = await DisputeModel.update(disputeId, {
      ...updates,
      assignedAdminId: req.user!.uid
    });

    res.json(createApiResponse(true, updatedDispute, 'Dispute updated successfully'));
  })
);

// GET /api/admin/analytics - Get platform analytics
router.get('/analytics', 
  authenticate,
  authorizeRoles('admin'),
  asyncHandler(async (req, res) => {
    const { period = '30d' } = req.query;

    // This would typically involve complex aggregation queries
    // For now, return mock analytics data
    const analytics = {
      userGrowth: {
        period,
        data: [
          { date: '2024-01-01', users: 100, providers: 20 },
          { date: '2024-01-02', users: 105, providers: 22 }
        ]
      },
      bookingTrends: {
        period,
        data: [
          { date: '2024-01-01', bookings: 50, revenue: 2500 },
          { date: '2024-01-02', bookings: 55, revenue: 2750 }
        ]
      },
      topCategories: [
        { category: 'Plumbing', bookings: 150, revenue: 7500 },
        { category: 'Electrical', bookings: 120, revenue: 6000 }
      ],
      platformMetrics: {
        averageBookingValue: 125,
        customerRetentionRate: 0.75,
        providerUtilizationRate: 0.68,
        disputeRate: 0.02
      }
    };

    res.json(createApiResponse(true, analytics, 'Analytics data retrieved successfully'));
  })
);

export default router;