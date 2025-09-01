import express from 'express';
import * as admin from 'firebase-admin';
import { authenticate, authorizeRoles } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import { asyncHandler, NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../middleware/errorHandler';
import { BookingModel, ServiceModel, UserModel, NotificationModel, PaymentModel, createApiResponse, createPaginatedResponse } from '../models/firestore';
import { Booking, BookingStatus } from '../models/types';

const router = express.Router();

// POST /api/bookings - Create new booking
router.post('/', 
  authenticate,
  validate(schemas.bookingCreate),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { serviceId, scheduledDate, scheduledTime, duration, location, notes, customerNotes } = req.body;
    const customerId = req.user.uid;

    // Verify service exists and is active
    const service = await ServiceModel.findById(serviceId);
    if (!service || !service.isActive) {
      throw new NotFoundError('Service');
    }

    // Verify customer role
    const customer = await UserModel.findById(customerId);
    if (!customer || customer.role !== 'customer') {
      throw new ForbiddenError('Only customers can create bookings');
    }

    // Check for scheduling conflicts
    const providerId = service.providerId;
    const bookingDate = admin.firestore.Timestamp.fromDate(new Date(scheduledDate));
    
    const existingBookings = await BookingModel.findByUser(providerId, 'provider');
    const conflicts = existingBookings.filter(booking => {
      if (!['confirmed', 'in_progress'].includes(booking.status)) return false;
      
      const bookingDateStr = booking.scheduledDate.toDate().toDateString();
      const requestedDateStr = bookingDate.toDate().toDateString();
      
      if (bookingDateStr !== requestedDateStr) return false;
      
      // Check time overlap
      const existingStart = parseTime(booking.scheduledTime);
      const existingEnd = existingStart + booking.duration;
      const requestedStart = parseTime(scheduledTime);
      const requestedEnd = requestedStart + (duration || service.duration);
      
      return (requestedStart < existingEnd && requestedEnd > existingStart);
    });

    if (conflicts.length > 0) {
      throw new ConflictError('The requested time slot is not available');
    }

    // Calculate pricing
    const serviceDuration = duration || service.duration;
    const servicePrice = service.price.type === 'hourly' 
      ? (service.price.amount * serviceDuration / 60)
      : service.price.amount;
    
    const materialsCost = service.materials?.reduce((sum, material) => 
      material.isRequired ? sum + material.cost : sum, 0) || 0;
    
    const taxes = servicePrice * 0.08; // 8% tax
    const fees = servicePrice * 0.03; // 3% platform fee
    const total = servicePrice + materialsCost + taxes + fees;

    // Create booking
    const bookingData: Partial<Booking> = {
      customerId,
      providerId,
      serviceId,
      scheduledDate: bookingDate,
      scheduledTime,
      duration: serviceDuration,
      location,
      notes,
      customerNotes,
      price: {
        servicePrice,
        materialsCost,
        taxes,
        fees,
        total,
        currency: service.price.currency
      }
    };

    const booking = await BookingModel.create(bookingData);

    // Send notification to provider
    await NotificationModel.create({
      userId: providerId,
      type: 'booking_request',
      title: 'New Booking Request',
      message: `You have a new booking request for ${service.title}`,
      data: { bookingId: booking.id, serviceId, customerId }
    });

    res.status(201).json(createApiResponse(true, booking, 'Booking created successfully'));
  })
);

// GET /api/bookings - Get user's bookings
router.get('/', 
  authenticate,
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const userId = req.user.uid;
    const userRole = req.user.role;

    if (!userRole || !['customer', 'provider'].includes(userRole)) {
      throw new ForbiddenError('Invalid user role');
    }

    let bookings = await BookingModel.findByUser(userId, userRole as 'customer' | 'provider');

    // Apply filters
    if (status) {
      bookings = bookings.filter(booking => booking.status === status);
    }

    if (startDate) {
      const start = new Date(startDate as string);
      bookings = bookings.filter(booking => booking.scheduledDate.toDate() >= start);
    }

    if (endDate) {
      const end = new Date(endDate as string);
      bookings = bookings.filter(booking => booking.scheduledDate.toDate() <= end);
    }

    // Get additional data for each booking
    const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
      const service = await ServiceModel.findById(booking.serviceId);
      const otherUserId = userRole === 'customer' ? booking.providerId : booking.customerId;
      const otherUser = await UserModel.findById(otherUserId);

      return {
        ...booking,
        service: service ? {
          id: service.id,
          title: service.title,
          category: service.category,
          images: service.images
        } : null,
        [userRole === 'customer' ? 'provider' : 'customer']: otherUser ? {
          id: otherUser.id,
          displayName: otherUser.displayName,
          photoURL: otherUser.photoURL
        } : null
      };
    }));

    // Apply pagination
    const total = enrichedBookings.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedBookings = enrichedBookings.slice(startIndex, startIndex + Number(limit));

    const response = createPaginatedResponse(paginatedBookings, Number(page), Number(limit), total);
    res.json(response);
  })
);

// GET /api/bookings/:bookingId - Get booking details
router.get('/:bookingId', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking');
    }

    // Check if user has access to this booking
    if (booking.customerId !== req.user.uid && 
        booking.providerId !== req.user.uid && 
        req.user.role !== 'admin') {
      throw new ForbiddenError('Access denied');
    }

    // Get additional data
    const [service, customer, provider] = await Promise.all([
      ServiceModel.findById(booking.serviceId),
      UserModel.findById(booking.customerId),
      UserModel.findById(booking.providerId)
    ]);

    const enrichedBooking = {
      ...booking,
      service: service ? {
        id: service.id,
        title: service.title,
        description: service.description,
        category: service.category,
        images: service.images,
        price: service.price
      } : null,
      customer: customer ? {
        id: customer.id,
        displayName: customer.displayName,
        photoURL: customer.photoURL,
        phone: customer.phone
      } : null,
      provider: provider ? {
        id: provider.id,
        displayName: provider.displayName,
        photoURL: provider.photoURL,
        phone: provider.phone,
        businessName: (provider as any).businessName
      } : null
    };

    res.json(createApiResponse(true, enrichedBooking, 'Booking details retrieved successfully'));
  })
);

// PUT /api/bookings/:bookingId - Update booking
router.put('/:bookingId', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  validate(schemas.bookingUpdate),
  asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const updates = req.body;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking');
    }

    // Check permissions for different update types
    if (updates.status) {
      const newStatus = updates.status as BookingStatus;
      
      // Status transition rules
      if (newStatus === 'confirmed' && booking.customerId !== req.user.uid) {
        throw new ForbiddenError('Only customers can confirm bookings');
      }
      
      if (['in_progress', 'completed'].includes(newStatus) && 
          booking.providerId !== req.user.uid) {
        throw new ForbiddenError('Only providers can update booking progress');
      }
      
      if (newStatus === 'cancelled') {
        if (booking.customerId !== req.user.uid && booking.providerId !== req.user.uid) {
          throw new ForbiddenError('Only booking participants can cancel');
        }
      }
    }

    // Provider can only update provider notes
    if (req.user.uid === booking.providerId) {
      const allowedFields = ['providerNotes', 'status'];
      const hasInvalidFields = Object.keys(updates).some(key => !allowedFields.includes(key));
      if (hasInvalidFields) {
        throw new ForbiddenError('Providers can only update provider notes and status');
      }
    }

    // Customer can only update customer notes and cancel
    if (req.user.uid === booking.customerId) {
      const allowedFields = ['customerNotes', 'status', 'cancellationReason'];
      const hasInvalidFields = Object.keys(updates).some(key => !allowedFields.includes(key));
      if (hasInvalidFields) {
        throw new ForbiddenError('Customers can only update customer notes, cancel, or confirm');
      }
    }

    const updatedBooking = await BookingModel.update(bookingId, updates);

    // Send notifications for status changes
    if (updates.status) {
      const notificationUserId = req.user.uid === booking.customerId ? booking.providerId : booking.customerId;
      const service = await ServiceModel.findById(booking.serviceId);
      
      let notificationData = {
        userId: notificationUserId,
        type: `booking_${updates.status}` as any,
        title: `Booking ${updates.status.charAt(0).toUpperCase() + updates.status.slice(1)}`,
        message: `Your booking for ${service?.title || 'service'} has been ${updates.status}`,
        data: { bookingId, serviceId: booking.serviceId }
      };

      await NotificationModel.create(notificationData);
    }

    res.json(createApiResponse(true, updatedBooking, 'Booking updated successfully'));
  })
);

// PUT /api/bookings/:bookingId/status - Update booking status
router.put('/:bookingId/status', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { bookingId } = req.params;
    const { status, reason } = req.body;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    if (!status || !['confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'].includes(status)) {
      throw new ValidationError('Valid status is required');
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking');
    }

    // Check permissions and validate status transitions
    const currentStatus = booking.status;
    const newStatus = status as BookingStatus;

    if (!isValidStatusTransition(currentStatus, newStatus, req.user.uid, booking)) {
      throw new ForbiddenError('Invalid status transition or insufficient permissions');
    }

    const updates: any = { status: newStatus };
    if (reason) updates.cancellationReason = reason;

    const updatedBooking = await BookingModel.updateStatus(bookingId, newStatus);

    // Handle payment for completed bookings
    if (newStatus === 'completed' && booking.paymentStatus === 'paid') {
      // Process payment to provider (this would integrate with Stripe)
      // await processPaymentToProvider(booking);
    }

    res.json(createApiResponse(true, updatedBooking, 'Booking status updated successfully'));
  })
);

// DELETE /api/bookings/:bookingId - Cancel/Delete booking
router.delete('/:bookingId', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking');
    }

    // Only booking participants can cancel
    if (booking.customerId !== req.user.uid && 
        booking.providerId !== req.user.uid && 
        req.user.role !== 'admin') {
      throw new ForbiddenError('Access denied');
    }

    // Can only cancel pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new ValidationError('Can only cancel pending or confirmed bookings');
    }

    await BookingModel.updateStatus(bookingId, 'cancelled');

    // Handle refunds if payment was made
    if (booking.paymentStatus === 'paid') {
      // Process refund (this would integrate with Stripe)
      // await processRefund(booking);
    }

    res.json(createApiResponse(true, null, 'Booking cancelled successfully'));
  })
);

// GET /api/bookings/:bookingId/timeline - Get booking timeline/history
router.get('/:bookingId/timeline', 
  authenticate,
  validate(schemas.mongoId, 'params'),
  asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking');
    }

    // Check access
    if (booking.customerId !== req.user.uid && 
        booking.providerId !== req.user.uid && 
        req.user.role !== 'admin') {
      throw new ForbiddenError('Access denied');
    }

    // Build timeline from booking data
    const timeline = [
      {
        event: 'booking_created',
        timestamp: booking.createdAt,
        description: 'Booking request created'
      }
    ];

    if (booking.status === 'confirmed') {
      timeline.push({
        event: 'booking_confirmed',
        timestamp: booking.updatedAt,
        description: 'Booking confirmed by customer'
      });
    }

    if (booking.completedAt) {
      timeline.push({
        event: 'booking_completed',
        timestamp: booking.completedAt,
        description: 'Service completed'
      });
    }

    if (booking.cancelledAt) {
      timeline.push({
        event: 'booking_cancelled',
        timestamp: booking.cancelledAt,
        description: `Booking cancelled${booking.cancellationReason ? ': ' + booking.cancellationReason : ''}`
      });
    }

    res.json(createApiResponse(true, timeline, 'Booking timeline retrieved successfully'));
  })
);

// Helper functions
function parseTime(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function isValidStatusTransition(
  currentStatus: BookingStatus, 
  newStatus: BookingStatus, 
  userId: string, 
  booking: Booking
): boolean {
  const isCustomer = userId === booking.customerId;
  const isProvider = userId === booking.providerId;

  switch (newStatus) {
    case 'confirmed':
      return currentStatus === 'pending' && isCustomer;
    case 'in_progress':
      return currentStatus === 'confirmed' && isProvider;
    case 'completed':
      return currentStatus === 'in_progress' && isProvider;
    case 'cancelled':
      return ['pending', 'confirmed'].includes(currentStatus) && (isCustomer || isProvider);
    case 'disputed':
      return ['completed'].includes(currentStatus) && (isCustomer || isProvider);
    default:
      return false;
  }
}

export default router;
