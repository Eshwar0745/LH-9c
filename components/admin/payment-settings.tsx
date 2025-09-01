"use client"

import { useEffect, useState } from "react"
import { getDb, onSnapshot } from "@/firebase/db" // Assuming these are imported from a Firebase utility file
import { profile } from "@/context/authContext" // Assuming profile is imported from an auth context file

const PaymentSettings = () => {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsub: (() => void) | undefined
    async function start() {
      try {
        setError(null)
        if (!profile || profile.role !== "admin") return
        const db = await getDb()
        // ... existing onSnapshot/getDoc wrapped safely ...
        unsub = onSnapshot(
          // ... existing docRef ...
          (snap) => {
            // ... existing state update ...
          },
          (err) => {
            console.log("[v0] payment settings snapshot error:", err)
            setError(err.message || "Failed to load payment settings.")
          },
        )
      } catch (err: any) {
        console.log("[v0] payment settings init error:", err?.message)
        setError(err?.message || "Failed to initialize payment settings.")
      }
    }
    start()
    return () => {
      try {
        unsub && unsub()
      } catch {}
    }
  }, [profile])

  async function handleSave(/* args */) {
    try {
      setError(null)
      if (!profile || profile.role !== "admin") return
      const db = await getDb()
      // ... existing setDoc/updateDoc code ...
    } catch (err: any) {
      console.log("[v0] payment settings save error:", err?.message)
      setError(err?.message || "Failed to save payment settings.")
    }
  }

  // Inline alert
  return (
    <div>
      {error ? (
        <div className="mt-2 rounded-md border border-destructive/20 p-3 text-sm text-destructive">{error}</div>
      ) : null}
      {/* ... existing code here ... */}
    </div>
  )
}

export default PaymentSettings
