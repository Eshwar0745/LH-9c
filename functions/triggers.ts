import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Trigger: On booking status update, notify provider/customer
export const onBookingStatusUpdate = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status !== after.status) {
      // Send notification to provider and customer
      const notifPayload = {
        type: 'booking_status',
        title: `Booking ${after.status}`,
        message: `Your booking is now ${after.status}`,
        data: { bookingId: context.params.bookingId, status: after.status },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false
      };
      await Promise.all([
        admin.firestore().collection('notifications').add({
          ...notifPayload,
          userId: after.providerId
        }),
        admin.firestore().collection('notifications').add({
          ...notifPayload,
          userId: after.customerId
        })
      ]);
    }
    return null;
  });

// Trigger: On new review, update provider average rating
export const onReviewCreate = functions.firestore
  .document('reviews/{reviewId}')
  .onCreate(async (snap, context) => {
    const review = snap.data();
    const providerId = review.providerId;
    const reviewsSnap = await admin.firestore().collection('reviews').where('providerId', '==', providerId).get();
    const reviews = reviewsSnap.docs.map(doc => doc.data());
    const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length) : 0;
    await admin.firestore().collection('users').doc(providerId).update({ rating: avgRating, reviewCount: reviews.length });
    return null;
  });

// Trigger: On new chat message, notify recipient(s)
export const onMessageCreate = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const conversationSnap = await admin.firestore().collection('conversations').doc(message.conversationId).get();
    if (!conversationSnap.exists) return null;
    const conv = conversationSnap.data();
    const recipients = (conv.participantIds || []).filter((id: string) => id !== message.senderId);
    const notifPayload = {
      type: 'chat_message',
      title: 'New Message',
      message: message.text || 'You have a new message',
      data: { conversationId: message.conversationId },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    };
    await Promise.all(recipients.map(userId =>
      admin.firestore().collection('notifications').add({ ...notifPayload, userId })
    ));
    return null;
  });

// Trigger: On service soft delete/activation, notify provider
export const onServiceUpdate = functions.firestore
  .document('services/{serviceId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.isActive !== after.isActive) {
      const notifPayload = {
        type: 'service_status',
        title: after.isActive ? 'Service Activated' : 'Service Deactivated',
        message: after.isActive ? 'Your service is now active.' : 'Your service has been deactivated.',
        data: { serviceId: context.params.serviceId },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
        userId: after.providerId
      };
      await admin.firestore().collection('notifications').add(notifPayload);
    }
    return null;
  });
