"use client"

import { useEffect, useState, useCallback } from "react"
import { User } from "firebase/auth"
import { firebaseClient, firestore } from "@/lib/firebase"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    firebaseClient.getAuthClient().then((auth) => {
      unsubscribe = auth.onAuthStateChanged(async (firebaseUser: User | null) => {
        setUser(firebaseUser)
        setLoading(false)

        if (firebaseUser) {
          // keep Firestore profile in sync
          await firestore.upsertUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "",
            role: "customer", // default role
          })
        }
      })
    })
    return () => unsubscribe && unsubscribe()
  }, [])

  // ✅ email/password sign in
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const user = await firebaseClient.signInWithEmail(email, password)
    if (!user.emailVerified) {
      throw new Error("Please verify your email before signing in.")
    }
    return user
  }, [])

  // ✅ sign up
  const signUpWithEmail = useCallback(
    async (email: string, password: string, name: string) => {
      const newUser = await firebaseClient.signUpWithEmail(email, password)

      // send verification email
      await firebaseClient.sendEmailVerificationLink(newUser)

      // store profile in Firestore
      await firestore.upsertUserProfile({
        uid: newUser.uid,
        email,
        name,
        role: "customer",
      })

      return newUser
    },
    [],
  )

  // ✅ Google login
  const signInWithGoogle = useCallback(async () => {
    const googleUser = await firebaseClient.signInWithGoogle()
    await firestore.upsertUserProfile({
      uid: googleUser.uid,
      email: googleUser.email || "",
      name: googleUser.displayName || "",
      role: "customer",
    })
    return googleUser
  }, [])

  // ✅ resend verification email
  const resendVerificationEmail = useCallback(async () => {
    if (!user) throw new Error("No user is currently signed in")
    if (user.emailVerified) throw new Error("Email is already verified")

    await firebaseClient.sendEmailVerificationLink(user)
    return "Verification email re-sent. Please check your inbox."
  }, [user])

  // ✅ sign out
  const signOut = useCallback(async () => {
    const auth = await firebaseClient.getAuthClient()
    await auth.signOut()
  }, [])

  return {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resendVerificationEmail, // 👈 new function
    signOut,
  }
}
