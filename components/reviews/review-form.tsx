"use client"

import { useState } from "react"
import type React from "react"
import { getDb } from "@/lib/firebase-chat"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

export function ReviewForm({ providerId }: { providerId: string }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      const db = getDb()
      await addDoc(collection(db, "reviews"), {
        providerId,
        rating,
        comment,
        authorName: "Anonymous",
        createdAt: serverTimestamp(),
      })
      setComment("")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 rounded border border-gray-200 p-4 bg-white">
      <div className="flex items-center gap-3">
        <label className="text-sm" htmlFor="rating">
          Rating
        </label>
        <select
          id="rating"
          className="h-9 rounded border border-gray-300 px-2"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} Stars
            </option>
          ))}
        </select>
      </div>
      <label className="mt-3 block" htmlFor="comment">
        <span className="text-sm">Comment</span>
        <textarea
          id="comment"
          className="mt-1 w-full rounded border border-gray-300 p-2"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience"
        />
      </label>
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded bg-orange-500 text-white disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit review"}
        </button>
      </div>
    </form>
  )
}
