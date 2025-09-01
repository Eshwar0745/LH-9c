import * as admin from 'firebase-admin';
import { 
  User, 
  Provider, 
  Service, 
  Booking, 
  Review, 
  Conversation, 
  Message, 
  Notification, 
  Payment, 
  Category, 
  Dispute,
  ApiResponse,
  PaginatedResponse
} from './types';

const db = admin.firestore();

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  SERVICES: 'services',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  PAYMENTS: 'payments',
  CATEGORIES: 'categories',
  DISPUTES: 'disputes',
  PUSH_TOKENS: 'pushTokens',
  ADMIN_LOGS: 'adminLogs'
};

// User Model
export class UserModel {
  static async create(userData: Partial<User>): Promise<User> {
    const userRef = db.collection(COLLECTIONS.USERS).doc();
    const user: User = {
      id: userRef.id,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      isVerified: false,
      isActive: true,
      ...userData
    } as User;
    
    await userRef.set(user);
    return user;
  }

  static async findById(userId: string): Promise<User | null> {
    const doc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as User : null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  static async update(userId: string, updates: Partial<User>): Promise<User> {
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    await userRef.update(updateData);
    const updated = await userRef.get();
    return { id: updated.id, ...updated.data() } as User;
  }

  static async delete(userId: string): Promise<void> {
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
      isActive: false,
      updatedAt: admin.firestore.Timestamp.now()
    });
  }

  static async getProviders(filters?: any): Promise<Provider[]> {
    let query = db.collection(COLLECTIONS.USERS)
      .where('role', '==', 'provider')
      .where('isActive', '==', true);

    if (filters?.isVerified !== undefined) {
      query = query.where('isVerified', '==', filters.isVerified);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Provider));
  }
}

// Service Model
export class ServiceModel {
  static async create(serviceData: Partial<Service>): Promise<Service> {
    const serviceRef = db.collection(COLLECTIONS.SERVICES).doc();
    const service: Service = {
      id: serviceRef.id,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      isActive: true,
      stats: {
        totalBookings: 0,
        averageRating: 0,
        totalReviews: 0,
        totalRevenue: 0,
        viewCount: 0
      },
      ...serviceData
    } as Service;
    
    await serviceRef.set(service);
    return service;
  }

  static async findById(serviceId: string): Promise<Service | null> {
    const doc = await db.collection(COLLECTIONS.SERVICES).doc(serviceId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Service : null;
  }

  static async findByProvider(providerId: string): Promise<Service[]> {
    const snapshot = await db.collection(COLLECTIONS.SERVICES)
      .where('providerId', '==', providerId)
      .where('isActive', '==', true)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
  }

  static async search(filters: any = {}): Promise<Service[]> {
    let query = db.collection(COLLECTIONS.SERVICES)
      .where('isActive', '==', true);

    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }

    if (filters.subcategory) {
      query = query.where('subcategory', '==', filters.subcategory);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
  }

  static async update(serviceId: string, updates: Partial<Service>): Promise<Service> {
    const serviceRef = db.collection(COLLECTIONS.SERVICES).doc(serviceId);
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    await serviceRef.update(updateData);
    const updated = await serviceRef.get();
    return { id: updated.id, ...updated.data() } as Service;
  }

  static async delete(serviceId: string): Promise<void> {
    await db.collection(COLLECTIONS.SERVICES).doc(serviceId).update({
      isActive: false,
      updatedAt: admin.firestore.Timestamp.now()
    });
  }

  static async incrementViewCount(serviceId: string): Promise<void> {
    const serviceRef = db.collection(COLLECTIONS.SERVICES).doc(serviceId);
    await serviceRef.update({
      'stats.viewCount': admin.firestore.FieldValue.increment(1)
    });
  }
}

// Booking Model
export class BookingModel {
  static async create(bookingData: Partial<Booking>): Promise<Booking> {
    const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc();
    const booking: Booking = {
      id: bookingRef.id,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      ...bookingData
    } as Booking;
    
    await bookingRef.set(booking);
    return booking;
  }

  static async findById(bookingId: string): Promise<Booking | null> {
    const doc = await db.collection(COLLECTIONS.BOOKINGS).doc(bookingId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Booking : null;
  }

  static async findByUser(userId: string, role: 'customer' | 'provider'): Promise<Booking[]> {
    const field = role === 'customer' ? 'customerId' : 'providerId';
    const snapshot = await db.collection(COLLECTIONS.BOOKINGS)
      .where(field, '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
  }

  static async update(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
    const bookingRef = db.collection(COLLECTIONS.BOOKINGS).doc(bookingId);
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    await bookingRef.update(updateData);
    const updated = await bookingRef.get();
    return { id: updated.id, ...updated.data() } as Booking;
  }

  static async updateStatus(bookingId: string, status: string): Promise<Booking> {
    const updates: any = { status };
    
    if (status === 'completed') {
      updates.completedAt = admin.firestore.Timestamp.now();
    } else if (status === 'cancelled') {
      updates.cancelledAt = admin.firestore.Timestamp.now();
    }
    
    return this.update(bookingId, updates);
  }
}

// Review Model
export class ReviewModel {
  static async create(reviewData: Partial<Review>): Promise<Review> {
    const reviewRef = db.collection(COLLECTIONS.REVIEWS).doc();
    const review: Review = {
      id: reviewRef.id,
      isVerified: false,
      isPublic: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      ...reviewData
    } as Review;
    
    await reviewRef.set(review);
    return review;
  }

  static async findByTarget(targetId: string, targetType: 'provider' | 'customer'): Promise<Review[]> {
    const snapshot = await db.collection(COLLECTIONS.REVIEWS)
      .where('targetId', '==', targetId)
      .where('targetType', '==', targetType)
      .where('isPublic', '==', true)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
  }

  static async findById(reviewId: string): Promise<Review | null> {
    const doc = await db.collection(COLLECTIONS.REVIEWS).doc(reviewId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Review : null;
  }

  static async addResponse(reviewId: string, response: any): Promise<Review> {
    const reviewRef = db.collection(COLLECTIONS.REVIEWS).doc(reviewId);
    await reviewRef.update({
      response: {
        ...response,
        createdAt: admin.firestore.Timestamp.now()
      },
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    const updated = await reviewRef.get();
    return { id: updated.id, ...updated.data() } as Review;
  }
}

// Conversation Model
export class ConversationModel {
  static async create(conversationData: Partial<Conversation>): Promise<Conversation> {
    const conversationRef = db.collection(COLLECTIONS.CONVERSATIONS).doc();
    const conversation: Conversation = {
      id: conversationRef.id,
      isActive: true,
      lastMessageAt: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      ...conversationData
    } as Conversation;
    
    await conversationRef.set(conversation);
    return conversation;
  }

  static async findByParticipants(participantIds: string[]): Promise<Conversation | null> {
    const snapshot = await db.collection(COLLECTIONS.CONVERSATIONS)
      .where('participantIds', 'array-contains-any', participantIds)
      .get();
    
    for (const doc of snapshot.docs) {
      const data = doc.data() as Conversation;
      if (data.participantIds.every(id => participantIds.includes(id)) &&
          participantIds.every(id => data.participantIds.includes(id))) {
        return { id: doc.id, ...data };
      }
    }
    
    return null;
  }

  static async findByUser(userId: string): Promise<Conversation[]> {
    const snapshot = await db.collection(COLLECTIONS.CONVERSATIONS)
      .where('participantIds', 'array-contains', userId)
      .where('isActive', '==', true)
      .orderBy('lastMessageAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
  }

  static async updateLastMessage(conversationId: string, message: Message): Promise<void> {
    await db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId).update({
      lastMessage: message,
      lastMessageAt: message.createdAt,
      updatedAt: admin.firestore.Timestamp.now()
    });
  }
}

// Message Model
export class MessageModel {
  static async create(messageData: Partial<Message>): Promise<Message> {
    const messageRef = db.collection(COLLECTIONS.MESSAGES).doc();
    const message: Message = {
      id: messageRef.id,
      type: 'text',
      isRead: false,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      ...messageData
    } as Message;
    
    await messageRef.set(message);
    return message;
  }

  static async findByConversation(conversationId: string, limit = 50): Promise<Message[]> {
    const snapshot = await db.collection(COLLECTIONS.MESSAGES)
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
  }

  static async markAsRead(messageId: string): Promise<void> {
    await db.collection(COLLECTIONS.MESSAGES).doc(messageId).update({
      isRead: true,
      updatedAt: admin.firestore.Timestamp.now()
    });
  }
}

// Notification Model
export class NotificationModel {
  static async create(notificationData: Partial<Notification>): Promise<Notification> {
    const notificationRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc();
    const notification: Notification = {
      id: notificationRef.id,
      isRead: false,
      createdAt: admin.firestore.Timestamp.now(),
      ...notificationData
    } as Notification;
    
    await notificationRef.set(notification);
    return notification;
  }

  static async findByUser(userId: string, limit = 50): Promise<Notification[]> {
    const snapshot = await db.collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
  }

  static async markAsRead(notificationId: string): Promise<void> {
    await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).update({
      isRead: true,
      readAt: admin.firestore.Timestamp.now()
    });
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const batch = db.batch();
    const snapshot = await db.collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isRead: true,
        readAt: admin.firestore.Timestamp.now()
      });
    });
    
    await batch.commit();
  }
}

// Payment Model
export class PaymentModel {
  static async create(paymentData: Partial<Payment>): Promise<Payment> {
    const paymentRef = db.collection(COLLECTIONS.PAYMENTS).doc();
    const payment: Payment = {
      id: paymentRef.id,
      status: 'pending',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      ...paymentData
    } as Payment;
    
    await paymentRef.set(payment);
    return payment;
  }

  static async findById(paymentId: string): Promise<Payment | null> {
    const doc = await db.collection(COLLECTIONS.PAYMENTS).doc(paymentId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Payment : null;
  }

  static async findByBooking(bookingId: string): Promise<Payment | null> {
    const snapshot = await db.collection(COLLECTIONS.PAYMENTS)
      .where('bookingId', '==', bookingId)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Payment;
  }

  static async update(paymentId: string, updates: Partial<Payment>): Promise<Payment> {
    const paymentRef = db.collection(COLLECTIONS.PAYMENTS).doc(paymentId);
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    await paymentRef.update(updateData);
    const updated = await paymentRef.get();
    return { id: updated.id, ...updated.data() } as Payment;
  }
}

// Category Model
export class CategoryModel {
  static async findAll(): Promise<Category[]> {
    const snapshot = await db.collection(COLLECTIONS.CATEGORIES)
      .where('isActive', '==', true)
      .orderBy('name')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  }

  static async findById(categoryId: string): Promise<Category | null> {
    const doc = await db.collection(COLLECTIONS.CATEGORIES).doc(categoryId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Category : null;
  }

  static async create(categoryData: Partial<Category>): Promise<Category> {
    const categoryRef = db.collection(COLLECTIONS.CATEGORIES).doc();
    const category: Category = {
      id: categoryRef.id,
      isActive: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      ...categoryData
    } as Category;
    
    await categoryRef.set(category);
    return category;
  }
}

// Dispute Model
export class DisputeModel {
  static async create(disputeData: Partial<Dispute>): Promise<Dispute> {
    const disputeRef = db.collection(COLLECTIONS.DISPUTES).doc();
    const dispute: Dispute = {
      id: disputeRef.id,
      status: 'open',
      priority: 'medium',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      ...disputeData
    } as Dispute;
    
    await disputeRef.set(dispute);
    return dispute;
  }

  static async findById(disputeId: string): Promise<Dispute | null> {
    const doc = await db.collection(COLLECTIONS.DISPUTES).doc(disputeId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Dispute : null;
  }

  static async findAll(filters?: any): Promise<Dispute[]> {
    let query = db.collection(COLLECTIONS.DISPUTES);

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.priority) {
      query = query.where('priority', '==', filters.priority);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dispute));
  }

  static async update(disputeId: string, updates: Partial<Dispute>): Promise<Dispute> {
    const disputeRef = db.collection(COLLECTIONS.DISPUTES).doc(disputeId);
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    if (updates.status === 'resolved') {
      updateData.resolvedAt = admin.firestore.Timestamp.now();
    }
    
    await disputeRef.update(updateData);
    const updated = await disputeRef.get();
    return { id: updated.id, ...updated.data() } as Dispute;
  }
}

// Utility functions
export const createPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

export const createApiResponse = <T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string
): ApiResponse<T> => {
  return {
    success,
    data,
    message,
    error
  };
};

// Legacy exports for backward compatibility
export const db = admin.firestore();
export const usersCollection = db.collection('users');
export const servicesCollection = db.collection('services');
export const bookingsCollection = db.collection('bookings');
export const reviewsCollection = db.collection('reviews');
export const messagesCollection = db.collection('messages');
export const categoriesCollection = db.collection('categories');
