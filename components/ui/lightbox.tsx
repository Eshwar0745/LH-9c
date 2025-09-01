"use client"

import { useState } from "react"

export function Lightbox({ images }: { images: string[] }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  if (!images?.length) return null

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            className="relative aspect-video overflow-hidden rounded border border-gray-200"
            onClick={() => {
              setIndex(i)
              setOpen(true)
            }}
          >
            <img
              src={src || "/placeholder.svg?height=300&width=300&query=portfolio image"}
              alt={`Portfolio ${i + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setOpen(false)}
        >
          <div className="max-w-3xl w-full bg-white rounded shadow p-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[index] || "/placeholder.svg?height=800&width=1200&query=portfolio image"}
              alt={`Portfolio enlarged ${index + 1}`}
              className="w-full h-auto rounded"
            />
            <div className="mt-3 flex items-center justify-between">
              <button className="px-3 py-2 rounded border border-gray-300" onClick={() => setOpen(false)}>
                Close
              </button>
              <div className="flex gap-2">
                <button
                  className="px-3 py-2 rounded bg-blue-600 text-white"
                  onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                >
                  Prev
                </button>
                <button
                  className="px-3 py-2 rounded bg-blue-600 text-white"
                  onClick={() => setIndex((i) => (i + 1) % images.length)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
