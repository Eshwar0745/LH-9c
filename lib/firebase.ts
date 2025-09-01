import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  Auth,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export getDb function for compatibility
export const getDb = () => db;

// Firebase Client wrapper
export const firebaseClient = {
  async getAuthClient(): Promise<Auth> {
    return auth;
  },

  async signInWithEmail(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  async signUpWithEmail(email: string, password: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  },

  async sendEmailVerificationLink(user: User): Promise<void> {
    await sendEmailVerification(user);
  },

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }
};

// Firestore wrapper
export const firestore = {
  async upsertUserProfile(profile: {
    uid: string;
    email: string;
    name: string;
    role: string;
  }): Promise<void> {
    const userRef = doc(db, 'users', profile.uid);
    
    // Check if user already exists
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      // Update existing user
      await setDoc(userRef, {
        ...profile,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      // Create new user
      await setDoc(userRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  },

  async getBookingById(bookingId: string) {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (bookingSnap.exists()) {
        return { id: bookingSnap.id, ...bookingSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting booking:', error);
      return null;
    }
  },

  async listBookingsByUser(userId: string) {
    try {
      // This is a simplified implementation for now
      // In a real app, you'd query the bookings collection
      return [];
    } catch (error) {
      console.error('Error listing bookings:', error);
      return [];
    }
  },

  async listBookingsByProvider(providerId: string) {
    try {
      // This is a simplified implementation for now
      // In a real app, you'd query the bookings collection
      return [];
    } catch (error) {
      console.error('Error listing provider bookings:', error);
      return [];
    }
  }
};

export default app;