import express from 'express';
import * as admin from 'firebase-admin';
import { authenticate, authorizeOwnership, authorizeRoles } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import { asyncHandler, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { UserModel, ServiceModel, BookingModel, ReviewModel, createApiResponse } from '../models/firestore';
import { User, Provider } from '../models/types';

const router = express.Router();

// GET /api/users/me - Get current user profile
router.get('/me', 
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new NotFoundError('User');
    }

    const user = await UserModel.findById(req.user.uid);
    if (!user) {
      throw new NotFoundError('User');
    }

    res.json(createApiResponse(true, user, 'User profile retrieved successfully'));
  })
);

// GET /api/users/:userId - Get user profile by ID
router.get('/:userId', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const user = await UserModel.findById(userId);
    
    if (!user || !user.isActive) {
      throw new NotFoundError('User');
    }

    // Return public profile info only (unless it's the user themselves or admin)
    const isOwner = req.user?.uid === userId;
    const isAdmin = req.user?.role === 'admin';

    if (isOwner || isAdmin) {
      res.json(createApiResponse(true, user, 'User profile retrieved successfully'));
    } else {
      // Return public profile only
      const publicProfile = {
        id: user.id,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        isVerified: user.isVerified,
        stats: user.stats,
        // Provider-specific public info
        ...(user.role === 'provider' && {
          businessName: (user as Provider).businessName,
          specializations: (user as Provider).specializations,
          yearsOfExperience: (user as Provider).yearsOfExperience,
          serviceRadius: (user as Provider).serviceRadius
        })
      };

      res.json(createApiResponse(true, publicProfile, 'Public profile retrieved successfully'));
    }
  })
);

// PUT /api/users/:userId - Update user profile
router.put('/:userId', 
  authenticate,
  authorizeOwnership('userId'),
  validate(schemas.mongoId, 'params'),
  validate(schemas.userUpdate),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const updatedUser = await UserModel.update(userId, updates);
    
    res.json(createApiResponse(true, updatedUser, 'User profile updated successfully'));
  })
);

// DELETE /api/users/:userId - Deactivate user account
router.delete('/:userId', 
  authenticate,
  authorizeOwnership('userId'),
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    await UserModel.delete(userId);
    
    res.json(createApiResponse(true, null, 'User account deactivated successfully'));
  })
);

// GET /api/users/:userId/services - Get user's services (for providers)
router.get('/:userId/services', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await UserModel.findById(userId);
    if (!user || user.role !== 'provider') {
      throw new NotFoundError('Provider');
    }

    const services = await ServiceModel.findByProvider(userId);
    
    res.json(createApiResponse(true, services, 'Provider services retrieved successfully'));
  })
);

// GET /api/users/:userId/bookings - Get user's bookings
router.get('/:userId/bookings', 
  authenticate,
  authorizeOwnership('userId'),
  validate(schemas.mongoId, 'params'),
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const role = user.role === 'provider' ? 'provider' : 'customer';
    const bookings = await BookingModel.findByUser(userId, role);
    
    res.json(createApiResponse(true, bookings, 'User bookings retrieved successfully'));
  })
);

// GET /api/users/:userId/reviews - Get reviews for user
router.get('/:userId/reviews', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const targetType = user.role === 'provider' ? 'provider' : 'customer';
    const reviews = await ReviewModel.findByTarget(userId, targetType);
    
    res.json(createApiResponse(true, reviews, 'User reviews retrieved successfully'));
  })
);

// POST /api/users/:userId/verify-email - Resend email verification
router.post('/:userId/verify-email', 
  authenticate,
  authorizeOwnership('userId'),
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    try {
      const verificationLink = await admin.auth().generateEmailVerificationLink(req.user!.email!);
      
      // In a real app, send this via email service
      res.json(createApiResponse(true, null, 'Verification email sent successfully'));
    } catch (error) {
      throw new Error('Failed to send verification email');
    }
  })
);

// PUT /api/users/:userId/preferences - Update user preferences
router.put('/:userId/preferences', 
  authenticate,
  authorizeOwnership('userId'),
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { preferences } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const updatedUser = await UserModel.update(userId, { preferences });
    
    res.json(createApiResponse(true, updatedUser.preferences, 'User preferences updated successfully'));
  })
);

// GET /api/users - Get all users (admin only)
router.get('/', 
  authenticate,
  authorizeRoles('admin'),
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const { role, isVerified, isActive } = req.query;

    // This would need pagination implementation in UserModel
    // For now, return basic implementation
    const filters: any = {};
    if (role) filters.role = role;
    if (isVerified !== undefined) filters.isVerified = isVerified === 'true';
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    // Basic implementation - would need proper pagination
    const users = await UserModel.getProviders(filters);
    
    res.json(createApiResponse(true, users, 'Users retrieved successfully'));
  })
);

// PUT /api/users/:userId/status - Update user status (admin only)
router.put('/:userId/status', 
  authenticate,
  authorizeRoles('admin'),
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isActive, isVerified } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const updates: any = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (isVerified !== undefined) updates.isVerified = isVerified;

    const updatedUser = await UserModel.update(userId, updates);
    
    res.json(createApiResponse(true, updatedUser, 'User status updated successfully'));
  })
);

export default router;
