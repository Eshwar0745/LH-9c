import { Request, Response, NextFunction } from 'express';
import * as functions from 'firebase-functions';

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string> = {}) {
    super(message, 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// Error handler middleware
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?.uid
  });

  // Firebase Auth errors
  if (err.code && err.code.startsWith('auth/')) {
    error = handleFirebaseAuthError(err);
  }

  // Firestore errors
  if (err.code && (err.code.includes('firestore') || err.code.includes('permission-denied'))) {
    error = handleFirestoreError(err);
  }

  // Validation errors
  if (err.name === 'ValidationError' || err.isJoi) {
    error = handleValidationError(err);
  }

  // Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    error = handleStripeError(err);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File too large', 413);
  }

  // Default to 500 server error
  if (!error.statusCode) {
    error = new AppError('Internal Server Error', 500);
  }

  // Send error response
  const response: any = {
    success: false,
    error: error.message
  };

  // Include validation errors if present
  if (error instanceof ValidationError && error.errors) {
    response.errors = error.errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
}

// Handle Firebase Auth errors
function handleFirebaseAuthError(err: any): AppError {
  switch (err.code) {
    case 'auth/user-not-found':
      return new NotFoundError('User');
    case 'auth/wrong-password':
      return new UnauthorizedError('Invalid credentials');
    case 'auth/email-already-in-use':
      return new ConflictError('Email already in use');
    case 'auth/weak-password':
      return new ValidationError('Password is too weak');
    case 'auth/invalid-email':
      return new ValidationError('Invalid email address');
    case 'auth/user-disabled':
      return new ForbiddenError('User account is disabled');
    case 'auth/too-many-requests':
      return new AppError('Too many requests, please try again later', 429);
    default:
      return new AppError('Authentication error', 401);
  }
}

// Handle Firestore errors
function handleFirestoreError(err: any): AppError {
  switch (err.code) {
    case 'permission-denied':
      return new ForbiddenError('Permission denied');
    case 'not-found':
      return new NotFoundError('Document');
    case 'already-exists':
      return new ConflictError('Document already exists');
    case 'resource-exhausted':
      return new AppError('Rate limit exceeded', 429);
    case 'unavailable':
      return new AppError('Service temporarily unavailable', 503);
    default:
      return new AppError('Database error', 500);
  }
}

// Handle validation errors
function handleValidationError(err: any): ValidationError {
  const errors: Record<string, string> = {};

  if (err.details) {
    // Joi validation errors
    err.details.forEach((detail: any) => {
      errors[detail.path.join('.')] = detail.message;
    });
  } else if (err.errors) {
    // Custom validation errors
    Object.assign(errors, err.errors);
  }

  return new ValidationError('Validation failed', errors);
}

// Handle Stripe errors
function handleStripeError(err: any): AppError {
  switch (err.type) {
    case 'StripeCardError':
      return new ValidationError('Card error: ' + err.message);
    case 'StripeRateLimitError':
      return new AppError('Too many requests to payment processor', 429);
    case 'StripeInvalidRequestError':
      return new ValidationError('Invalid payment request: ' + err.message);
    case 'StripeAPIError':
      return new AppError('Payment processor error', 502);
    case 'StripeConnectionError':
      return new AppError('Payment processor connection error', 503);
    case 'StripeAuthenticationError':
      return new AppError('Payment processor authentication error', 500);
    default:
      return new AppError('Payment processing error', 500);
  }
}

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
}
