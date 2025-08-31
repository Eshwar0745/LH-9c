"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { storage, firestore } from "@/lib/firebase"

export function PortfolioManager() {
  const { user, profile, refreshProfile } = useAuth()
  const [busy, setBusy] = useState(false)
  const items = profile?.portfolio || []

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user) return
    const files = e.target.files
    if (!files || files.length === 0) return
    setBusy(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const path = `providers/${user.uid}/portfolio/${Date.now()}-${file.name}`
        const url = await storage.uploadFile(path, file)
        urls.push(url)
      }
      await firestore.patchUserProfile(user.uid, {
        portfolio: [...(profile?.portfolio || []), ...urls],
      })
      await refreshProfile?.() // refresh profile in-place
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Portfolio</h2>
          <label className="inline-flex items-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={onUpload}
              className="hidden"
              disabled={busy}
              aria-label="Upload portfolio images"
            />
            <span className="inline-flex cursor-pointer items-center rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">
              {busy ? "Uploading…" : "Add images"}
            </span>
          </label>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Showcase your best work. JPG/PNG up to a few MB each.</p>

        {items.length === 0 ? (
          <div className="mt-4 rounded border p-4 text-sm text-muted-foreground">No portfolio items yet.</div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded border">
                {/* Use Next Image as simple tag to avoid layout shift */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src || "/placeholder.svg"} alt="Portfolio item" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
