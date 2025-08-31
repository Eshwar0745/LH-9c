import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null

export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app
  const apps = getApps()
  _app = apps.length
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      })
  return _app!
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth
  _auth = getAuth(getFirebaseApp())
  return _auth
}

export function getDb(): Firestore {
  if (_db) return _db
  _db = getFirestore(getFirebaseApp())
  return _db
}
