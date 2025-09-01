import express from 'express';
import * as admin from 'firebase-admin';
import { authenticate, authorizeRoles, authorizeOwnership } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import { asyncHandler, NotFoundError, ForbiddenError, ValidationError } from '../middleware/errorHandler';
import { UserModel, ServiceModel, BookingModel, NotificationModel, createApiResponse } from '../models/firestore';
import { Provider, Availability } from '../models/types';

const router = express.Router();

// GET /api/providers - Get all providers with filters
router.get('/', 
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, isVerified, category, location, rating } = req.query;

    const filters: any = {};
    if (isVerified !== undefined) filters.isVerified = isVerified === 'true';

    const providers = await UserModel.getProviders(filters);

    // Apply additional filters
    let filteredProviders = providers;

    if (category) {
      // Filter by services category - would need to join with services
      const providerServices = await Promise.all(
        providers.map(p => ServiceModel.findByProvider(p.id))
      );
      
      filteredProviders = providers.filter((provider, index) => 
        providerServices[index].some(service => service.category === category)
      );
    }

    if (rating) {
      filteredProviders = filteredProviders.filter(provider => 
        provider.stats && provider.stats.averageRating >= Number(rating)
      );
    }

    res.json(createApiResponse(true, filteredProviders, 'Providers retrieved successfully'));
  })
);

// GET /api/providers/:providerId - Get provider details
router.get('/:providerId', 
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { providerId } = req.params;

    const provider = await UserModel.findById(providerId);
    if (!provider || provider.role !== 'provider' || !provider.isActive) {
      throw new NotFoundError('Provider');
    }

    // Get provider's services
    const services = await ServiceModel.findByProvider(providerId);

    const providerData = {
      ...provider,
      services
    };

    res.json(createApiResponse(true, providerData, 'Provider details retrieved successfully'));
  })
);

// PUT /api/providers/:providerId/verify - Verify provider (admin only)
router.put('/:providerId/verify', 
  authenticate,
  authorizeRoles('admin'),
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const { isVerified, verificationNotes } = req.body;

    if (typeof isVerified !== 'boolean') {
      throw new ValidationError('isVerified must be a boolean');
    }

    const provider = await UserModel.findById(providerId);
    if (!provider || provider.role !== 'provider') {
      throw new NotFoundError('Provider');
    }

    const updatedProvider = await UserModel.update(providerId, { 
      isVerified,
      ...(verificationNotes && { verificationNotes })
    });

    // Send notification to provider
    await NotificationModel.create({
      userId: providerId,
      type: 'provider_verified',
      title: isVerified ? 'Account Verified' : 'Verification Status Updated',
      message: isVerified 
        ? 'Congratulations! Your provider account has been verified.'
        : 'Your verification status has been updated. Please check your account.',
      data: { isVerified, verificationNotes }
    });

    res.json(createApiResponse(true, updatedProvider, 'Provider verification status updated successfully'));
  })
);

// PUT /api/providers/:providerId/availability - Update provider availability
router.put('/:providerId/availability', 
  authenticate,
  authorizeOwnership('providerId'),
  validate(schemas.mongoId, 'params'),
  validate(schemas.availability),
  asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const { availability } = req.body;

    const provider = await UserModel.findById(providerId);
    if (!provider || provider.role !== 'provider') {
      throw new NotFoundError('Provider');
    }

    // Validate availability format
    for (const slot of availability) {
      if (slot.startTime >= slot.endTime) {
        throw new ValidationError('Start time must be before end time');
      }
    }

    const updatedProvider = await UserModel.update(providerId, { 
      availability 
    } as Partial<Provider>);

    res.json(createApiResponse(true, updatedProvider.availability, 'Availability updated successfully'));
  })
);

// GET /api/providers/:providerId/availability - Get provider availability
router.get('/:providerId/availability', 
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const { date } = req.query;

    const provider = await UserModel.findById(providerId) as Provider;
    if (!provider || provider.role !== 'provider') {
      throw new NotFoundError('Provider');
    }

    let availability = provider.availability || [];

    // If date is provided, filter for that specific day
    if (date) {
      const requestedDate = new Date(date as string);
      const dayOfWeek = requestedDate.getDay();
      availability = availability.filter(slot => slot.dayOfWeek === dayOfWeek);

      // Get existing bookings for that date to show unavailable slots
      const bookings = await BookingModel.findByUser(providerId, 'provider');
      const dateBookings = bookings.filter(booking => {
        const bookingDate = booking.scheduledDate.toDate();
        return bookingDate.toDateString() === requestedDate.toDateString() &&
               ['confirmed', 'in_progress'].includes(booking.status);
      });

      // Mark time slots as unavailable if booked
      availability = availability.map(slot => ({
        ...slot,
        bookedSlots: dateBookings.map(booking => ({
          startTime: booking.scheduledTime,
          duration: booking.duration
        }))
      }));
    }

    res.json(createApiResponse(true, availability, 'Provider availability retrieved successfully'));
  })
);

// PUT /api/providers/:providerId/profile - Update provider profile
router.put('/:providerId/profile', 
  authenticate,
  authorizeOwnership('providerId'),
  validate(schemas.mongoId, 'params'),
  validate(schemas.providerVerification),
  asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const updates = req.body;

    const provider = await UserModel.findById(providerId);
    if (!provider || provider.role !== 'provider') {
      throw new NotFoundError('Provider');
    }

    const updatedProvider = await UserModel.update(providerId, updates);

    res.json(createApiResponse(true, updatedProvider, 'Provider profile updated successfully'));
  })
);

// GET /api/providers/:providerId/stats - Get provider statistics
router.get('/:providerId/stats', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { providerId } = req.params;

    const provider = await UserModel.findById(providerId);
    if (!provider || provider.role !== 'provider') {
      throw new NotFoundError('Provider');
    }

    // Only provider themselves or admin can see detailed stats
    const isOwner = req.user?.uid === providerId;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('Access denied to provider statistics');
    }

    const bookings = await BookingModel.findByUser(providerId, 'provider');
    const services = await ServiceModel.findByProvider(providerId);

    const stats = {
      totalBookings: bookings.length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.price.total, 0),
      averageRating: provider.stats?.averageRating || 0,
      totalReviews: provider.stats?.totalReviews || 0,
      activeServices: services.filter(s => s.isActive).length,
      totalServices: services.length,
      monthlyBookings: getMonthlyBookings(bookings),
      recentBookings: bookings.slice(0, 5)
    };

    res.json(createApiResponse(true, stats, 'Provider statistics retrieved successfully'));
  })
);

// POST /api/providers/:providerId/documents - Upload verification documents
router.post('/:providerId/documents', 
  authenticate,
  authorizeOwnership('providerId'),
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const { documentType, documentUrl } = req.body;

    if (!documentType || !documentUrl) {
      throw new ValidationError('Document type and URL are required');
    }

    const provider = await UserModel.findById(providerId) as Provider;
    if (!provider || provider.role !== 'provider') {
      throw new NotFoundError('Provider');
    }

    const documents = provider.verificationDocuments || [];
    documents.push({
      type: documentType,
      url: documentUrl,
      uploadedAt: admin.firestore.Timestamp.now()
    });

    const updatedProvider = await UserModel.update(providerId, { 
      verificationDocuments: documents 
    } as Partial<Provider>);

    res.json(createApiResponse(true, updatedProvider.verificationDocuments, 'Document uploaded successfully'));
  })
);

// Helper function to calculate monthly bookings
function getMonthlyBookings(bookings: any[]) {
  const monthlyData: { [key: string]: number } = {};
  
  bookings.forEach(booking => {
    const date = booking.createdAt.toDate();
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12) // Last 12 months
    .map(([month, count]) => ({ month, count }));
}

export default router;
