# Local Hands Marketplace Backend

## API Documentation
- **OpenAPI/Swagger Spec:** See [`openapi.yaml`](./openapi.yaml) for the full OpenAPI 3.0 spec.
- **Base URL:** `/api`
- **Auth:** JWT Bearer tokens for all protected endpoints.

## Key Endpoints
- **Auth:** `/api/auth/register`, `/api/auth/login`, `/api/auth/google-signin`, `/api/auth/reset-password`, `/api/auth/verify-email`
- **Users:** `/api/users/:userId` (GET/PUT/DELETE)
- **Providers:** `/api/providers/:providerId/verify`, `/api/providers/:providerId/availability`
- **Services:** `/api/services` (GET/POST), `/api/services/:serviceId` (GET/PUT/DELETE)
- **Bookings:** `/api/bookings` (GET/POST), `/api/bookings/:bookingId` (GET/PUT/DELETE)
- **Reviews:** `/api/reviews` (POST), `/api/reviews/provider/:providerId` (GET)
- **Chat:** `/api/chat/messages`, `/api/chat/conversations`
- **Notifications:** `/api/notifications` (GET/POST), `/api/notifications/:notificationId/read`, `/api/notifications/subscribe`
- **Payments:** `/api/payments/intent`, `/api/payments/confirm`, `/api/payments/refund`
- **Admin:** `/api/admin/dashboard`, `/api/admin/users`, `/api/admin/bookings`, `/api/admin/disputes`
- **Uploads:** `/api/upload/avatar`, `/api/upload/service-image`, `/api/upload/chat-file`

## RBAC (Role-Based Access Control)
- **Admin endpoints** require `role: admin` (see `authorizeRoles` middleware).
- **Provider actions** (create/update/delete service, respond to reviews) require `role: provider`.
- **Customer actions** (create bookings, leave reviews) require `role: customer`.
- All endpoints enforce authentication and role checks as described in the OpenAPI spec.

This directory contains the Firebase Cloud Functions backend for the Local Hands marketplace platform.

## Setup Instructions

1. Install Firebase CLI and initialize functions:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init functions
   ```
2. Copy `.env.example` to `.env` and fill in your secrets.
3. Install dependencies:
   ```bash
   cd functions
   npm install
   ```
4. Serve locally:
   ```bash
   npm run serve
   ```
5. Deploy to Firebase:
   ```bash
   npm run deploy
   ```

## Structure
- `index.ts` - Entry point for Cloud Functions and Express API
- `routes/` - API route handlers
- `models/` - Firestore data models
- `middleware/` - Auth, validation, error handling
- `utils/` - Utility functions

## Requirements
- Node.js 18+
- Firebase CLI

---

See the main project README for full details.
