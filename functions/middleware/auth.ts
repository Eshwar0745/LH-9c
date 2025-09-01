import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { UserModel } from '../models/firestore';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken & {
        role?: string;
        userData?: any;
      };
    }
  }
}

// Authentication middleware
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Missing or invalid Authorization header' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user data from Firestore
    const userData = await UserModel.findById(decodedToken.uid);
    
    if (!userData || !userData.isActive) {
      return res.status(401).json({ 
        success: false, 
        error: 'User account is inactive or not found' 
      });
    }

    // Attach user info to request
    req.user = {
      ...decodedToken,
      role: userData.role,
      userData
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
}

// Optional authentication middleware (for public endpoints that can benefit from user context)
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const userData = await UserModel.findById(decodedToken.uid);
    
    if (userData && userData.isActive) {
      req.user = {
        ...decodedToken,
        role: userData.role,
        userData
      };
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
}

// Role-based access control middleware
export function authorizeRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
}

// Check if user owns the resource
export function authorizeOwnership(resourceUserIdField = 'userId') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (req.user.role === 'admin' || req.user.uid === resourceUserId) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      error: 'Forbidden: you can only access your own resources' 
    });
  };
}

// Check if user is verified
export function requireVerification(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }

  if (!req.user.userData?.isVerified) {
    return res.status(403).json({ 
      success: false, 
      error: 'Account verification required' 
    });
  }

  next();
}

// Rate limiting by user
export function rateLimitByUser(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.uid || req.ip;
    const now = Date.now();
    
    const userLimit = userRequests.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      });
    }
    
    userLimit.count++;
    next();
  };
}
