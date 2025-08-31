"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { firebaseClient, firestore } from "@/lib/firebase"
import type { User } from "firebase/auth"
import type { UserProfile } from "@/lib/types"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let unsub: any
    firebaseClient
      .getAuthClient()
      .then((auth) => {
        unsub = auth.onAuthStateChanged((u) => {
          setUser(u)
          setInitializing(false)
        })
      })
      .catch(() => setInitializing(false))
    return () => {
      if (unsub) unsub()
    }
  }, [])

  const {
    data: profile,
    isLoading: profileLoading,
    mutate,
  } = useSWR<UserProfile | null>(user ? ["profile", user.uid] : null, async () => {
    if (!user) return null
    return await firestore.getUserProfile(user.uid)
  })

  const loading = initializing || (!!user && profileLoading)

  return useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile: mutate,
    }),
    [user, profile, loading, mutate],
  )
}
