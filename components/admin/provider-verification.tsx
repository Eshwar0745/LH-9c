"use client"

import { useState, useEffect } from "react"
import { getDb, onSnapshot } from "@/firebase/config" // Import getDb and onSnapshot
import type { Profile } from "@/types" // Import Profile type if needed

const ProviderVerification = ({ profile }: { profile: Profile | null }) => {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let unsub: (() => void) | undefined
    async function start() {
      try {
        setError(null)
        if (!profile || profile.role !== "admin") return
        const db = await getDb()
        // ... existing subscription/query code wrapped safely ...
        unsub = onSnapshot(
          // ... existing query ...
          (snap) => {
            // ... existing setState mapping ...
          },
          (err) => {
            console.log("[v0] admin verification snapshot error:", err)
            setError(err.message || "Failed to load verification queue.")
          },
        )
      } catch (err: any) {
        console.log("[v0] admin verification init error:", err?.message)
        setError(err?.message || "Failed to initialize verification queue.")
      }
    }
    start()
    return () => {
      try {
        unsub && unsub()
      } catch {}
    }
  }, [profile])

  return (
    <div>
      {error ? (
        <div className="mt-2 rounded-md border border-destructive/20 p-3 text-sm text-destructive">
          {error}
          <div className="mt-1 text-muted-foreground">
            If you are using Firestore default rules, grant admin read/write for verification resources.
          </div>
        </div>
      ) : null}
      {/* ... rest of code here ... */}
    </div>
  )
}

export default ProviderVerification
