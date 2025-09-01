# Firebase Setup Guide

## 🔥 Quick Firebase Setup (5 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `local-hands-dev`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication
1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable:
   - ✅ Email/Password
   - ✅ Google (optional)

### Step 3: Create Firestore Database
1. Go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode"
4. Select location (us-central1)

### Step 4: Get Firebase Config
1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click "Web app" icon (`</>`)
4. Register app name: `local-hands-web`
5. Copy the config object

### Step 5: Update Environment Variables
Replace the values in `.env.local`:

```bash
# Your Firebase Config (from Step 4)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=local-hands-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=local-hands-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=local-hands-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5001/local-hands-dev/us-central1/api
```

## 🚀 Alternative: Use Firebase Emulator (Recommended for Development)

### Quick Start with Emulator
```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize Firebase in your project
firebase init

# 4. Select:
# - Firestore
# - Functions
# - Hosting
# - Storage
# - Emulators

# 5. Start emulators
firebase emulators:start
```

### Emulator Environment Variables
```bash
# For Firebase Emulator
NEXT_PUBLIC_FIREBASE_API_KEY=demo-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=demo-app-id

# Emulator API
NEXT_PUBLIC_API_URL=http://localhost:5001/demo-project/us-central1/api
```

## ✅ Test Your Setup

### 1. Start the project
```bash
npm run dev
```

### 2. Test authentication
- Go to http://localhost:3000
- Try to sign up/sign in
- Check browser console for errors

### 3. Verify Firebase connection
```bash
# Test backend
curl http://localhost:5001/your-project-id/us-central1/api
```

## 🔧 Common Issues & Fixes

### Issue: "auth/invalid-api-key"
**Fix:** Update your `.env.local` with correct Firebase config

### Issue: "Firebase project not found"
**Fix:** Make sure project ID matches in both frontend and backend

### Issue: "CORS error"
**Fix:** Add your domain to Firebase Auth authorized domains

## 🎯 Quick Demo Setup (2 minutes)

If you just want to demo quickly:

```bash
# 1. Use demo config
cp .env.example .env.local

# 2. Update with demo values
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-project
NEXT_PUBLIC_API_URL=http://localhost:5001/demo-project/us-central1/api

# 3. Start Firebase emulator
firebase emulators:start

# 4. Start Next.js
npm run dev
```

## 📱 Test Authentication Flow

### Sign Up Test
```javascript
// Test data
{
  email: "test@example.com",
  password: "TestPass123!",
  name: "Test User",
  role: "customer"
}
```

### Sign In Test
```javascript
// Test credentials
{
  email: "test@example.com", 
  password: "TestPass123!"
}
```

Your authentication should work 100% after this setup! 🚀