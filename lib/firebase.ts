import type { Auth, User } from "firebase/auth"
import type { UserProfile } from "@/lib/types"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, query, where, getDocs, getDoc } from "firebase/firestore"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { signInWithEmailAndPassword } from "firebase/auth"
import { sendPasswordResetEmail } from "firebase/auth"
import { sendEmailVerification } from "firebase/auth"

const requiredKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const

const hasEnv = requiredKeys.every((k) => !!process.env[k])

let __firebaseApp: any | undefined
let __firestore: Firestore | undefined

export function getDb(): Firestore {
  if (!__firebaseApp) {
    if (!hasEnv) {
      throw new Error("Firebase not configured")
    }
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
    __firebaseApp = getApps().length ? getApps()[0] : initializeApp(config)
  }
  if (!__firestore) {
    __firestore = getFirestore(__firebaseApp)
  }
  return __firestore
}

async function getConfigured(): Promise<{
  app: any
  auth: Auth
  db: Firestore
} | null> {
  if (!hasEnv) return null
  const [{ getAuth }] = await Promise.all([import("firebase/auth")])

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  const app = getApps().length ? getApps()[0] : initializeApp(config)
  const auth = getAuth(app)
  const db = getFirestore(app)
  return { app, auth, db }
}

export const firebaseClient = {
  isConfigured: hasEnv,
  async getAuthClient() {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    return cfg.auth
  },
  async signInWithEmail(email: string, password: string) {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    const cred = await signInWithEmailAndPassword(cfg.auth, email, password)
    return cred.user
  },
  async signUpWithEmail(email: string, password: string) {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    const cred = await createUserWithEmailAndPassword(cfg.auth, email, password)
    return cred.user
  },
  async signInWithGoogle() {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(cfg.auth, provider)
    return cred.user
  },
  async sendPasswordReset(email: string) {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    await sendPasswordResetEmail(cfg.auth, email)
  },
  async sendEmailVerificationLink(user: User) {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    await sendEmailVerification(user)
  },
}

// Firestore helpers
export const firestore = {
  async upsertUserProfile(profile: UserProfile) {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    const ref = doc(cfg.db, "users", profile.uid)
    await setDoc(
      ref,
      {
        ...profile,
        createdAt: profile.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  },
  async patchUserProfile(uid: string, data: Partial<UserProfile>) {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    const ref = doc(cfg.db, "users", uid)
    await setDoc(
      ref,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  },
  async getUserProfile(uid: string) {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    const ref = doc(cfg.db, "users", uid)
    const snap = await getDoc(ref)
    return snap.exists() ? (snap.data() as UserProfile) : null
  },
  async listBookingsByUser(uid: string) {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    const base = collection(cfg.db, "bookings")
    const q = query(base, where("userId", "==", uid))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  },
  async listBookingsByProvider(providerId: string) {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    const base = collection(cfg.db, "bookings")
    const q = query(base, where("providerId", "==", providerId))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  },
  async getBookingById(id: string) {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    const ref = doc(cfg.db, "bookings", id)
    const snap = await getDoc(ref)
    return snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null
  },
  async listProviders(category?: string) {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    const base = collection(cfg.db, "users")
    // providers by role, optionally filter by category (array-contains)
    const q =
      category && category.length
        ? query(base, where("role", "==", "provider"), where("categories", "array-contains", category))
        : query(base, where("role", "==", "provider"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  },
}

// Storage helpers
export const storage = {
  async uploadFile(path: string, file: File) {
    const cfg = await getConfigured()
    if (!cfg) throw new Error("Firebase not configured")
    const st = getStorage(cfg.app)
    const r = ref(st, path)
    await uploadBytes(r, file)
    return await getDownloadURL(r)
  },
}
