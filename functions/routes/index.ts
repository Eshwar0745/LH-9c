import express from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import providerRoutes from './providers';
import serviceRoutes from './services';
import bookingRoutes from './bookings';
import paymentRoutes from './payments';
import reviewRoutes from './reviews';
import chatRoutes from './chat';
import notificationRoutes from './notifications';
import adminRoutes from './admin';
import uploadRoutes from './upload';
// ...

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/services', serviceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
// ...

export default router;
