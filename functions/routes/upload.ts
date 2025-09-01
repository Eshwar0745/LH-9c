import express from 'express';
import * as admin from 'firebase-admin';
import { authenticate } from '../middleware/auth';
import { validateFileUpload } from '../middleware/validate';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { createApiResponse } from '../models/firestore';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/upload/image - Upload image file
router.post('/image', 
  authenticate,
  validateFileUpload(['image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024), // 5MB limit
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ValidationError('Authentication required');
    }

    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const file = req.file;
    const bucket = admin.storage().bucket();
    const fileName = `images/${req.user.uid}/${uuidv4()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    try {
      // Upload file to Firebase Storage
      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: req.user.uid,
            originalName: file.originalname
          }
        }
      });

      // Make file publicly accessible
      await fileUpload.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      const uploadResult = {
        url: publicUrl,
        filename: fileName,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      };

      res.json(createApiResponse(true, uploadResult, 'Image uploaded successfully'));
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image');
    }
  })
);

// POST /api/upload/document - Upload document file
router.post('/document', 
  authenticate,
  validateFileUpload(['application/pdf', 'image/jpeg', 'image/png'], 10 * 1024 * 1024), // 10MB limit
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ValidationError('Authentication required');
    }

    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const file = req.file;
    const bucket = admin.storage().bucket();
    const fileName = `documents/${req.user.uid}/${uuidv4()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    try {
      // Upload file to Firebase Storage
      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: req.user.uid,
            originalName: file.originalname,
            documentType: req.body.documentType || 'general'
          }
        }
      });

      // Get signed URL for private access
      const [signedUrl] = await fileUpload.getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });

      const uploadResult = {
        url: signedUrl,
        filename: fileName,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        documentType: req.body.documentType || 'general'
      };

      res.json(createApiResponse(true, uploadResult, 'Document uploaded successfully'));
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload document');
    }
  })
);

// DELETE /api/upload/:filename - Delete uploaded file
router.delete('/:filename', 
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ValidationError('Authentication required');
    }

    const { filename } = req.params;
    
    // Verify file belongs to user or user is admin
    if (!filename.includes(req.user.uid) && req.user.role !== 'admin') {
      throw new ValidationError('Access denied');
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file(filename);

    try {
      await file.delete();
      res.json(createApiResponse(true, null, 'File deleted successfully'));
    } catch (error) {
      console.error('Delete error:', error);
      throw new Error('Failed to delete file');
    }
  })
);

// POST /api/upload/avatar - Upload user avatar
router.post('/avatar', 
  authenticate,
  validateFileUpload(['image/jpeg', 'image/png', 'image/webp'], 2 * 1024 * 1024), // 2MB limit
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new ValidationError('Authentication required');
    }

    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const file = req.file;
    const bucket = admin.storage().bucket();
    const fileName = `avatars/${req.user.uid}/avatar-${Date.now()}.${file.mimetype.split('/')[1]}`;
    const fileUpload = bucket.file(fileName);

    try {
      // Upload file to Firebase Storage
      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: req.user.uid,
            type: 'avatar'
          }
        }
      });

      // Make file publicly accessible
      await fileUpload.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // Update user profile with new avatar URL
      await admin.firestore().collection('users').doc(req.user.uid).update({
        photoURL: publicUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const uploadResult = {
        url: publicUrl,
        filename: fileName,
        size: file.size,
        mimetype: file.mimetype
      };

      res.json(createApiResponse(true, uploadResult, 'Avatar uploaded successfully'));
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload avatar');
    }
  })
);

export default router;