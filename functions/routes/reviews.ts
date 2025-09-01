import express from 'express';
import * as admin from 'firebase-admin';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import { asyncHandler, NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../middleware/errorHandler';
import { ReviewModel, BookingModel, UserModel, ServiceModel, NotificationModel, createApiResponse, createPaginatedResponse } from '../models/firestore';
import { Review } from '../models/types';

const router = express.Router();

// POST /api/reviews - Create new review
router.post('/', 
  authenticate,
  validate(schemas.reviewCreate),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { bookingId, rating, title, comment } = req.body;
    const authorId = req.user.uid;

    // Verify booking exists and is completed
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking');
    }

    if (booking.status !== 'completed') {
      throw new ValidationError('Can only review completed bookings');
    }

    // Verify user is the customer of this booking
    if (booking.customerId !== authorId) {
      throw new ForbiddenError('Only the customer can review this booking');
    }

    // Check if review already exists
    const existingReviews = await ReviewModel.findByTarget(booking.providerId, 'provider');
    const existingReview = existingReviews.find(review => review.bookingId === bookingId);
    
    if (existingReview) {
      throw new ConflictError('Review already exists for this booking');
    }

    // Create review
    const reviewData: Partial<Review> = {
      bookingId,
      authorId,
      targetId: booking.providerId,
      targetType: 'provider',
      rating,
      title,
      comment,
      isVerified: true // Since it's from a completed booking
    };

    const review = await ReviewModel.create(reviewData);

    // Update provider's average rating
    await updateProviderRating(booking.providerId);

    // Update service stats
    await updateServiceRating(booking.serviceId);

    // Send notification to provider
    await NotificationModel.create({
      userId: booking.providerId,
      type: 'review_received',
      title: 'New Review Received',
      message: `You received a ${rating}-star review`,
      data: { reviewId: review.id, bookingId, rating }
    });

    res.status(201).json(createApiResponse(true, review, 'Review submitted successfully'));
  })
);

// GET /api/reviews/provider/:providerId - Get reviews for a provider
router.get('/provider/:providerId', 
  validate(schemas.mongoId, 'params'),
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { providerId } = req.params;
    const { page = 1, limit = 20, rating, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Verify provider exists
    const provider = await UserModel.findById(providerId);
    if (!provider || provider.role !== 'provider') {
      throw new NotFoundError('Provider');
    }

    let reviews = await ReviewModel.findByTarget(providerId, 'provider');

    // Apply rating filter
    if (rating) {
      reviews = reviews.filter(review => review.rating === Number(rating));
    }

    // Sort reviews
    reviews = reviews.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'rating':
          aVal = a.rating;
          bVal = b.rating;
          break;
        case 'createdAt':
        default:
          aVal = a.createdAt;
          bVal = b.createdAt;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Enrich reviews with customer data
    const enrichedReviews = await Promise.all(reviews.map(async (review) => {
      const customer = await UserModel.findById(review.authorId);
      const booking = await BookingModel.findById(review.bookingId);
      const service = booking ? await ServiceModel.findById(booking.serviceId) : null;

      return {
        ...review,
        customer: customer ? {
          id: customer.id,
          displayName: customer.displayName,
          photoURL: customer.photoURL
        } : null,
        service: service ? {
          id: service.id,
          title: service.title
        } : null
      };
    }));

    // Calculate statistics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedReviews = enrichedReviews.slice(startIndex, startIndex + Number(limit));

    const response = createPaginatedResponse(paginatedReviews, Number(page), Number(limit), totalReviews);
    response.meta = {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution
    };

    res.json(response);
  })
);

// GET /api/reviews/:reviewId - Get specific review
router.get('/:reviewId', 
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    const review = await ReviewModel.findById(reviewId);
    if (!review || !review.isPublic) {
      throw new NotFoundError('Review');
    }

    // Enrich with customer and service data
    const [customer, booking] = await Promise.all([
      UserModel.findById(review.authorId),
      BookingModel.findById(review.bookingId)
    ]);

    const service = booking ? await ServiceModel.findById(booking.serviceId) : null;

    const enrichedReview = {
      ...review,
      customer: customer ? {
        id: customer.id,
        displayName: customer.displayName,
        photoURL: customer.photoURL
      } : null,
      service: service ? {
        id: service.id,
        title: service.title
      } : null
    };

    res.json(createApiResponse(true, enrichedReview, 'Review retrieved successfully'));
  })
);

// POST /api/reviews/:reviewId/response - Add provider response to review
router.post('/:reviewId/response', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  validate(schemas.reviewResponse),
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { comment } = req.body;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const review = await ReviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review');
    }

    // Verify user is the provider being reviewed
    if (review.targetId !== req.user.uid) {
      throw new ForbiddenError('Only the reviewed provider can respond');
    }

    // Check if response already exists
    if (review.response) {
      throw new ConflictError('Response already exists for this review');
    }

    const response = {
      authorId: req.user.uid,
      comment
    };

    const updatedReview = await ReviewModel.addResponse(reviewId, response);

    // Send notification to customer
    await NotificationModel.create({
      userId: review.authorId,
      type: 'review_received',
      title: 'Provider Responded to Your Review',
      message: 'The provider has responded to your review',
      data: { reviewId, providerId: req.user.uid }
    });

    res.json(createApiResponse(true, updatedReview, 'Response added successfully'));
  })
);

// PUT /api/reviews/:reviewId/response - Update provider response
router.put('/:reviewId/response', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  validate(schemas.reviewResponse),
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { comment } = req.body;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const review = await ReviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review');
    }

    // Verify user is the provider being reviewed
    if (review.targetId !== req.user.uid) {
      throw new ForbiddenError('Only the reviewed provider can update response');
    }

    if (!review.response) {
      throw new NotFoundError('Response not found');
    }

    const response = {
      authorId: req.user.uid,
      comment
    };

    const updatedReview = await ReviewModel.addResponse(reviewId, response);

    res.json(createApiResponse(true, updatedReview, 'Response updated successfully'));
  })
);

// DELETE /api/reviews/:reviewId/response - Delete provider response
router.delete('/:reviewId/response', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const review = await ReviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review');
    }

    // Verify user is the provider being reviewed
    if (review.targetId !== req.user.uid) {
      throw new ForbiddenError('Only the reviewed provider can delete response');
    }

    if (!review.response) {
      throw new NotFoundError('Response not found');
    }

    // Remove response by updating with null
    const updatedReview = await ReviewModel.addResponse(reviewId, null);

    res.json(createApiResponse(true, updatedReview, 'Response deleted successfully'));
  })
);

// PUT /api/reviews/:reviewId/visibility - Update review visibility (admin only)
router.put('/:reviewId/visibility', 
  authenticate,
  authorizeRoles('admin'),
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { isPublic } = req.body;

    if (typeof isPublic !== 'boolean') {
      throw new ValidationError('isPublic must be a boolean');
    }

    const review = await ReviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review');
    }

    // Update review visibility
    const updatedReview = await ReviewModel.update(reviewId, { isPublic });

    res.json(createApiResponse(true, updatedReview, 'Review visibility updated successfully'));
  })
);

// GET /api/reviews/customer/:customerId - Get reviews by customer (admin only)
router.get('/customer/:customerId', 
  authenticate,
  authorizeRoles('admin'),
  validate(schemas.mongoId, 'params'),
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // This would need a custom query since we're looking by authorId
    // For now, return empty array as this would require additional indexing
    const reviews: Review[] = [];

    const response = createPaginatedResponse(reviews, Number(page), Number(limit), 0);
    res.json(response);
  })
);

// Helper functions
async function updateProviderRating(providerId: string): Promise<void> {
  try {
    const reviews = await ReviewModel.findByTarget(providerId, 'provider');
    
    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await UserModel.update(providerId, {
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length
      }
    } as any);
  } catch (error) {
    console.error('Error updating provider rating:', error);
  }
}

async function updateServiceRating(serviceId: string): Promise<void> {
  try {
    // Get all bookings for this service
    const service = await ServiceModel.findById(serviceId);
    if (!service) return;

    // Get all reviews for bookings of this service
    // This would require a more complex query in a real implementation
    // For now, we'll update the service stats separately
    
    await ServiceModel.update(serviceId, {
      stats: {
        ...service.stats,
        totalReviews: service.stats.totalReviews + 1
      }
    });
  } catch (error) {
    console.error('Error updating service rating:', error);
  }
}

export default router;
