"use client"

import { useEffect, useState } from "react"
import { getDb } from "@/lib/firebase-chat"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"

type Review = {
  id: string
  authorName: string
  rating: number
  comment: string
  createdAt?: any
}

export function ReviewList({ providerId }: { providerId: string }) {
  const [items, setItems] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const db = getDb()
        const q = query(
          collection(db, "reviews"),
          where("providerId", "==", providerId),
          orderBy("createdAt", "desc"),
          limit(25),
        )
        const snap = await getDocs(q)
        if (!active) return
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Review[])
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [providerId])

  if (loading) return <div className="h-24 rounded bg-gray-100 animate-pulse" />
  if (!items.length) return <p className="text-gray-600">No reviews yet.</p>

  return (
    <ul className="space-y-4">
      {items.map((r) => (
        <li key={r.id} className="rounded border border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <span className="font-medium">{r.authorName}</span>
            <span className="text-orange-500">
              {Array.from({ length: 5 }).map((_, i) => (i < r.rating ? "★" : "☆"))}
            </span>
          </div>
          <p className="mt-2 text-gray-800">{r.comment}</p>
        </li>
      ))}
    </ul>
  )
}
