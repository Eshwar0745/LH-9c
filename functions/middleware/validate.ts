import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler';

// Validation middleware factory
export function validate(schema: Joi.ObjectSchema, property: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors: Record<string, string> = {};
      error.details.forEach(detail => {
        errors[detail.path.join('.')] = detail.message;
      });
      
      return next(new ValidationError('Validation failed', errors));
    }

    // Replace the original data with validated/sanitized data
    req[property] = value;
    next();
  };
}

// Common validation schemas
export const schemas = {
  // User schemas
  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    displayName: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('customer', 'provider').required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().default('US'),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180)
      }).optional()
    }).optional()
  }),

  userUpdate: Joi.object({
    displayName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().default('US'),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180)
      }).optional()
    }).optional(),
    preferences: Joi.object({
      notifications: Joi.object({
        email: Joi.boolean().default(true),
        push: Joi.boolean().default(true),
        sms: Joi.boolean().default(false)
      }),
      language: Joi.string().default('en'),
      currency: Joi.string().default('USD'),
      timezone: Joi.string().default('America/New_York')
    }).optional()
  }),

  // Service schemas
  serviceCreate: Joi.object({
    title: Joi.string().min(5).max(100).required(),
    description: Joi.string().min(20).max(1000).required(),
    category: Joi.string().required(),
    subcategory: Joi.string().optional(),
    price: Joi.object({
      type: Joi.string().valid('fixed', 'hourly', 'custom').required(),
      amount: Joi.number().positive().required(),
      currency: Joi.string().default('USD'),
      minimumCharge: Joi.number().positive().optional()
    }).required(),
    duration: Joi.number().positive().required(),
    tags: Joi.array().items(Joi.string()).max(10).default([]),
    location: Joi.object({
      type: Joi.string().valid('provider_location', 'customer_location', 'both').required(),
      address: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string().default('US')
      }).optional(),
      serviceRadius: Joi.number().positive().max(100).optional()
    }).required(),
    requirements: Joi.array().items(Joi.string()).optional(),
    materials: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      cost: Joi.number().min(0).required(),
      isRequired: Joi.boolean().default(false),
      description: Joi.string().optional()
    })).optional()
  }),

  serviceUpdate: Joi.object({
    title: Joi.string().min(5).max(100).optional(),
    description: Joi.string().min(20).max(1000).optional(),
    price: Joi.object({
      type: Joi.string().valid('fixed', 'hourly', 'custom').required(),
      amount: Joi.number().positive().required(),
      currency: Joi.string().default('USD'),
      minimumCharge: Joi.number().positive().optional()
    }).optional(),
    duration: Joi.number().positive().optional(),
    tags: Joi.array().items(Joi.string()).max(10).optional(),
    isActive: Joi.boolean().optional(),
    requirements: Joi.array().items(Joi.string()).optional(),
    materials: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      cost: Joi.number().min(0).required(),
      isRequired: Joi.boolean().default(false),
      description: Joi.string().optional()
    })).optional()
  }),

  // Booking schemas
  bookingCreate: Joi.object({
    serviceId: Joi.string().required(),
    scheduledDate: Joi.date().min('now').required(),
    scheduledTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    duration: Joi.number().positive().optional(),
    location: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().default('US'),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180)
      }).optional()
    }).required(),
    notes: Joi.string().max(500).optional(),
    customerNotes: Joi.string().max(500).optional()
  }),

  bookingUpdate: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed').optional(),
    scheduledDate: Joi.date().min('now').optional(),
    scheduledTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    providerNotes: Joi.string().max(500).optional(),
    cancellationReason: Joi.string().max(200).optional()
  }),

  // Review schemas
  reviewCreate: Joi.object({
    bookingId: Joi.string().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    title: Joi.string().max(100).optional(),
    comment: Joi.string().max(1000).optional()
  }),

  reviewResponse: Joi.object({
    comment: Joi.string().min(10).max(500).required()
  }),

  // Message schemas
  messageCreate: Joi.object({
    conversationId: Joi.string().optional(),
    receiverId: Joi.string().optional(),
    content: Joi.string().min(1).max(1000).required(),
    type: Joi.string().valid('text', 'image', 'file', 'system').default('text')
  }),

  // Search schemas
  serviceSearch: Joi.object({
    q: Joi.string().optional(),
    category: Joi.string().optional(),
    subcategory: Joi.string().optional(),
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      radius: Joi.number().positive().max(100).default(25)
    }).optional(),
    priceRange: Joi.object({
      min: Joi.number().min(0).optional(),
      max: Joi.number().positive().optional()
    }).optional(),
    rating: Joi.number().min(1).max(5).optional(),
    sortBy: Joi.string().valid('price', 'rating', 'distance', 'popularity').default('popularity'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20)
  }),

  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  // ID parameter schema
  mongoId: Joi.object({
    id: Joi.string().required()
  }),

  // Provider verification schema
  providerVerification: Joi.object({
    businessName: Joi.string().min(2).max(100).optional(),
    businessLicense: Joi.string().optional(),
    taxId: Joi.string().optional(),
    specializations: Joi.array().items(Joi.string()).optional(),
    yearsOfExperience: Joi.number().integer().min(0).max(50).optional(),
    insurance: Joi.object({
      provider: Joi.string().required(),
      policyNumber: Joi.string().required(),
      expirationDate: Joi.date().min('now').required(),
      coverageAmount: Joi.number().positive().required()
    }).optional(),
    bankAccount: Joi.object({
      accountHolderName: Joi.string().required(),
      routingNumber: Joi.string().pattern(/^\d{9}$/).required(),
      accountNumber: Joi.string().min(4).max(20).required(),
      bankName: Joi.string().required()
    }).optional()
  }),

  // Availability schema
  availability: Joi.object({
    availability: Joi.array().items(Joi.object({
      dayOfWeek: Joi.number().integer().min(0).max(6).required(),
      startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      isAvailable: Joi.boolean().required()
    })).required()
  }),

  // Payment schemas
  paymentIntent: Joi.object({
    bookingId: Joi.string().required(),
    paymentMethodId: Joi.string().optional()
  }),

  // Admin schemas
  disputeUpdate: Joi.object({
    status: Joi.string().valid('open', 'investigating', 'resolved', 'closed').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    assignedAdminId: Joi.string().optional(),
    resolution: Joi.string().max(1000).optional()
  })
};

// Validate file upload
export function validateFileUpload(
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'],
  maxSize: number = 5 * 1024 * 1024 // 5MB
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file && !req.files) {
      return next(new ValidationError('No file uploaded'));
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

    for (const file of files) {
      if (!file) continue;

      if (!allowedTypes.includes(file.mimetype)) {
        return next(new ValidationError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
      }

      if (file.size > maxSize) {
        return next(new ValidationError(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`));
      }
    }

    next();
  };
}
