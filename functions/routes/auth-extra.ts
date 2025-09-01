import express from 'express';
import * as admin from 'firebase-admin';
import Joi from 'joi';
import { validate } from '../middleware/validate';
import { errorHandler } from '../middleware/errorHandler';

const router = express.Router();

const googleSigninSchema = Joi.object({
  idToken: Joi.string().required(),
  role: Joi.string().valid('customer', 'provider', 'admin').required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const verifyEmailSchema = Joi.object({
  uid: Joi.string().required()
});

// POST /api/auth/google-signin
router.post('/google-signin', validate(googleSigninSchema), async (req, res, next) => {
  const { idToken, role } = req.body;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    let userRecord = await admin.auth().getUser(decoded.uid);
    // Update custom claims if role changed
    if (userRecord.customClaims?.role !== role) {
      await admin.auth().setCustomUserClaims(decoded.uid, { role });
    }
    // Upsert Firestore user document
    const userDocRef = admin.firestore().collection('users').doc(decoded.uid);
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists) {
      await userDocRef.set({
        uid: decoded.uid,
        email: decoded.email,
        name: userRecord.displayName || '',
        phone: userRecord.phoneNumber || '',
        role,
        avatar: '',
        address: {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        emailVerified: userRecord.emailVerified,
        isActive: true,
        businessName: '',
        experience: 0,
        services: [],
        hourlyRate: 0,
        availability: {},
        isVerified: false,
        documents: [],
        rating: 0,
        reviewCount: 0,
      });
    }
    const token = await admin.auth().createCustomToken(decoded.uid, { role });
    res.json({ success: true, data: { uid: decoded.uid, token, role }, message: 'Google sign-in successful' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  const { email } = req.body;
  try {
    const link = await admin.auth().generatePasswordResetLink(email);
    // Optionally send via custom email service
    res.json({ success: true, message: 'Password reset email sent', data: { link } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', validate(verifyEmailSchema), async (req, res, next) => {
  const { uid } = req.body;
  try {
    await admin.auth().updateUser(uid, { emailVerified: true });
    await admin.firestore().collection('users').doc(uid).update({ emailVerified: true });
    res.json({ success: true, message: 'Email verified' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout (stateless JWT, client should just discard token)
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out (client should discard token)' });
});

export default router;
