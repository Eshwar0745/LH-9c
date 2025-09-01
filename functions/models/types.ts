import * as admin from 'firebase-admin';

// User Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'customer' | 'provider' | 'admin';
  phone?: string;
  address?: Address;
  isVerified: boolean;
  isActive: boolean;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  lastLoginAt?: admin.firestore.Timestamp;
  preferences?: UserPreferences;
  stats?: UserStats;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  language: string;
  currency: string;
  timezone: string;
}

export interface UserStats {
  totalBookings: number;
  totalSpent?: number;
  totalEarned?: number;
  averageRating?: number;
  totalReviews: number;
}

// Provider Types
export interface Provider extends User {
  role: 'provider';
  businessName?: string;
  businessLicense?: string;
  taxId?: string;
  bankAccount?: BankAccount;
  availability: Availability[];
  serviceRadius: number; // in miles
  isVerified: boolean;
  verificationDocuments?: string[];
  specializations: string[];
  yearsOfExperience: number;
  insurance?: Insurance;
}

export interface BankAccount {
  accountHolderName: string;
  routingNumber: string;
  accountNumber: string;
  bankName: string;
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  expirationDate: admin.firestore.Timestamp;
  coverageAmount: number;
}

export interface Availability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
}

// Service Types
export interface Service {
  id: string;
  providerId: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: ServicePrice;
  duration: number; // in minutes
  images: string[];
  tags: string[];
  isActive: boolean;
  location: ServiceLocation;
  requirements?: string[];
  materials?: ServiceMaterial[];
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  stats: ServiceStats;
}

export interface ServicePrice {
  type: 'fixed' | 'hourly' | 'custom';
  amount: number;
  currency: string;
  minimumCharge?: number;
}

export interface ServiceLocation {
  type: 'provider_location' | 'customer_location' | 'both';
  address?: Address;
  serviceRadius?: number;
}

export interface ServiceMaterial {
  name: string;
  cost: number;
  isRequired: boolean;
  description?: string;
}

export interface ServiceStats {
  totalBookings: number;
  averageRating: number;
  totalReviews: number;
  totalRevenue: number;
  viewCount: number;
}

// Booking Types
export interface Booking {
  id: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  status: BookingStatus;
  scheduledDate: admin.firestore.Timestamp;
  scheduledTime: string;
  duration: number;
  location: Address;
  price: BookingPrice;
  notes?: string;
  customerNotes?: string;
  providerNotes?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  cancelledAt?: admin.firestore.Timestamp;
  cancellationReason?: string;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  refundId?: string;
}

export type BookingStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed';

export type PaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'refunded' 
  | 'partially_refunded';

export interface BookingPrice {
  servicePrice: number;
  materialsCost: number;
  taxes: number;
  fees: number;
  total: number;
  currency: string;
}

// Review Types
export interface Review {
  id: string;
  bookingId: string;
  authorId: string;
  targetId: string; // providerId or customerId
  targetType: 'provider' | 'customer';
  rating: number; // 1-5
  title?: string;
  comment?: string;
  images?: string[];
  isVerified: boolean;
  isPublic: boolean;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  response?: ReviewResponse;
}

export interface ReviewResponse {
  authorId: string;
  comment: string;
  createdAt: admin.firestore.Timestamp;
}

// Chat Types
export interface Conversation {
  id: string;
  participantIds: string[];
  participants: ConversationParticipant[];
  bookingId?: string;
  lastMessage?: Message;
  lastMessageAt: admin.firestore.Timestamp;
  isActive: boolean;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface ConversationParticipant {
  userId: string;
  displayName: string;
  photoURL?: string;
  role: 'customer' | 'provider';
  lastReadAt?: admin.firestore.Timestamp;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  attachments?: MessageAttachment[];
  isRead: boolean;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  editedAt?: admin.firestore.Timestamp;
  deletedAt?: admin.firestore.Timestamp;
}

export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: admin.firestore.Timestamp;
  readAt?: admin.firestore.Timestamp;
  expiresAt?: admin.firestore.Timestamp;
}

export type NotificationType = 
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'payment_received'
  | 'payment_failed'
  | 'review_received'
  | 'message_received'
  | 'provider_verified'
  | 'system_announcement';

// Payment Types
export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  refunds?: PaymentRefund[];
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface PaymentRefund {
  id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'succeeded' | 'failed';
  stripeRefundId: string;
  createdAt: admin.firestore.Timestamp;
}

// Admin Types
export interface AdminDashboard {
  stats: {
    totalUsers: number;
    totalProviders: number;
    totalCustomers: number;
    totalBookings: number;
    totalRevenue: number;
    activeDisputes: number;
  };
  recentActivity: AdminActivity[];
  topProviders: Provider[];
  topServices: Service[];
}

export interface AdminActivity {
  id: string;
  type: string;
  description: string;
  userId?: string;
  createdAt: admin.firestore.Timestamp;
}

export interface Dispute {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  reason: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignedAdminId?: string;
  resolution?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  resolvedAt?: admin.firestore.Timestamp;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  subcategories: Subcategory[];
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface Subcategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

// Search Types
export interface SearchFilters {
  category?: string;
  subcategory?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: {
    date: string;
    time: string;
  };
  sortBy?: 'price' | 'rating' | 'distance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  services: Service[];
  providers: Provider[];
  totalCount: number;
  hasMore: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// File Upload Types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}
