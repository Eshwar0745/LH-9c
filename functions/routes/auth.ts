import express from 'express';
import * as admin from 'firebase-admin';
import { validate, schemas } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { asyncHandler, AppError, ValidationError } from '../middleware/errorHandler';
import { UserModel, createApiResponse } from '../models/firestore';
import { User } from '../models/types';

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', 
  validate(schemas.userRegistration), 
  asyncHandler(async (req, res) => {
    const { email, password, displayName, role, phone, address } = req.body;

    try {
      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        throw new ValidationError('Email already in use');
      }

      // Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        phoneNumber: phone,
        emailVerified: false,
        disabled: false,
      });

      // Set custom claims for role
      await admin.auth().setCustomUserClaims(userRecord.uid, { role });

      // Create Firestore user document
      const userData: Partial<User> = {
        id: userRecord.uid,
        email,
        displayName,
        role,
        phone,
        address,
        isVerified: false,
        isActive: true,
        preferences: {
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          language: 'en',
          currency: 'USD',
          timezone: 'America/New_York'
        },
        stats: {
          totalBookings: 0,
          totalSpent: role === 'customer' ? 0 : undefined,
          totalEarned: role === 'provider' ? 0 : undefined,
          averageRating: 0,
          totalReviews: 0
        }
      };

      const user = await UserModel.create(userData);

      // Generate custom token for immediate login
      const customToken = await admin.auth().createCustomToken(userRecord.uid, { role });

      res.status(201).json(createApiResponse(true, {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          isVerified: user.isVerified
        },
        customToken
      }, 'Registration successful. Please verify your email.'));

    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        throw new ValidationError('Email already in use');
      }
      if (error.code === 'auth/weak-password') {
        throw new ValidationError('Password is too weak');
      }
      if (error.code === 'auth/invalid-email') {
        throw new ValidationError('Invalid email address');
      }
      throw error;
    }
  })
);

// POST /api/auth/verify-token - Verify Firebase ID token
router.post('/verify-token', 
  asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
      throw new ValidationError('ID token is required');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const user = await UserModel.findById(decodedToken.uid);

      if (!user || !user.isActive) {
        throw new AppError('User account not found or inactive', 404);
      }

      // Update last login time
      await UserModel.update(user.id, {
        lastLoginAt: admin.firestore.Timestamp.now()
      });

      res.json(createApiResponse(true, {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          isVerified: user.isVerified,
          photoURL: user.photoURL
        },
        tokenValid: true
      }, 'Token verified successfully'));

    } catch (error: any) {
      if (error.code === 'auth/id-token-expired') {
        throw new AppError('Token expired', 401);
      }
      if (error.code === 'auth/id-token-revoked') {
        throw new AppError('Token revoked', 401);
      }
      throw new AppError('Invalid token', 401);
    }
  })
);

// POST /api/auth/google-signin - Google Sign-In
router.post('/google-signin', 
  asyncHandler(async (req, res) => {
    const { idToken, role } = req.body;

    if (!idToken) {
      throw new ValidationError('Google ID token is required');
    }

    if (!role || !['customer', 'provider'].includes(role)) {
      throw new ValidationError('Valid role is required');
    }

    try {
      // Verify Google ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Check if user exists
      let user = await UserModel.findById(decodedToken.uid);

      if (!user) {
        // Create new user from Google account
        const userData: Partial<User> = {
          id: decodedToken.uid,
          email: decodedToken.email!,
          displayName: decodedToken.name || decodedToken.email!.split('@')[0],
          photoURL: decodedToken.picture,
          role,
          isVerified: decodedToken.email_verified || false,
          isActive: true,
          preferences: {
            notifications: {
              email: true,
              push: true,
              sms: false
            },
            language: 'en',
            currency: 'USD',
            timezone: 'America/New_York'
          },
          stats: {
            totalBookings: 0,
            totalSpent: role === 'customer' ? 0 : undefined,
            totalEarned: role === 'provider' ? 0 : undefined,
            averageRating: 0,
            totalReviews: 0
          }
        };

        user = await UserModel.create(userData);

        // Set custom claims
        await admin.auth().setCustomUserClaims(decodedToken.uid, { role });
      } else {
        // Update last login time
        await UserModel.update(user.id, {
          lastLoginAt: admin.firestore.Timestamp.now()
        });
      }

      if (!user.isActive) {
        throw new AppError('User account is inactive', 403);
      }

      res.json(createApiResponse(true, {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          isVerified: user.isVerified,
          photoURL: user.photoURL
        },
        isNewUser: !user.lastLoginAt
      }, 'Google sign-in successful'));

    } catch (error: any) {
      if (error.code && error.code.startsWith('auth/')) {
        throw new AppError('Google authentication failed', 401);
      }
      throw error;
    }
  })
);

// POST /api/auth/reset-password - Send password reset email
router.post('/reset-password', 
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError('Email is required');
    }

    try {
      // Check if user exists
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        res.json(createApiResponse(true, null, 'If an account with that email exists, a password reset link has been sent.'));
        return;
      }

      // Generate password reset link
      const resetLink = await admin.auth().generatePasswordResetLink(email);

      // In a real app, you would send this via email service
      // For now, we'll just return success
      res.json(createApiResponse(true, null, 'Password reset email sent successfully'));

    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        res.json(createApiResponse(true, null, 'If an account with that email exists, a password reset link has been sent.'));
        return;
      }
      throw error;
    }
  })
);

// POST /api/auth/verify-email - Send email verification
router.post('/verify-email', 
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    try {
      // Generate email verification link
      const verificationLink = await admin.auth().generateEmailVerificationLink(req.user.email!);

      // In a real app, you would send this via email service
      res.json(createApiResponse(true, null, 'Verification email sent successfully'));

    } catch (error: any) {
      throw new AppError('Failed to send verification email', 500);
    }
  })
);

// POST /api/auth/refresh-token - Refresh custom token
router.post('/refresh-token', 
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    try {
      const user = await UserModel.findById(req.user.uid);
      
      if (!user || !user.isActive) {
        throw new AppError('User account not found or inactive', 404);
      }

      // Generate new custom token
      const customToken = await admin.auth().createCustomToken(req.user.uid, { 
        role: user.role 
      });

      res.json(createApiResponse(true, { customToken }, 'Token refreshed successfully'));

    } catch (error) {
      throw new AppError('Failed to refresh token', 500);
    }
  })
);

// POST /api/auth/logout - Logout (revoke refresh tokens)
router.post('/logout', 
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    try {
      // Revoke all refresh tokens for the user
      await admin.auth().revokeRefreshTokens(req.user.uid);

      res.json(createApiResponse(true, null, 'Logged out successfully'));

    } catch (error) {
      throw new AppError('Failed to logout', 500);
    }
  })
);

// DELETE /api/auth/account - Delete user account
router.delete('/account', 
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    try {
      // Soft delete user in Firestore
      await UserModel.delete(req.user.uid);

      // Delete Firebase Auth user
      await admin.auth().deleteUser(req.user.uid);

      res.json(createApiResponse(true, null, 'Account deleted successfully'));

    } catch (error) {
      throw new AppError('Failed to delete account', 500);
    }
  })
);

export default router;
