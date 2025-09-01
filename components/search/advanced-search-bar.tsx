"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export function AdvancedSearchBar({ categories = [] as string[] }) {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get("q") ?? "")
  const [cat, setCat] = useState(params.get("category") ?? "")
  const [loc, setLoc] = useState(params.get("loc") ?? "")

  function apply() {
    const usp = new URLSearchParams()
    if (q) usp.set("q", q)
    if (cat) usp.set("category", cat)
    if (loc) usp.set("loc", loc)
    router.push(`/search?${usp.toString()}`)
  }

  return (
    <div className="w-full rounded border border-gray-200 p-3 bg-white">
      <div className="grid gap-3 md:grid-cols-3">
        <input
          aria-label="Search keywords"
          placeholder="What do you need?"
          className="h-10 rounded border border-gray-300 px-3"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          aria-label="Category"
          className="h-10 rounded border border-gray-300 px-3"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          aria-label="Location"
          placeholder="City or ZIP"
          className="h-10 rounded border border-gray-300 px-3"
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
        />
      </div>
      <div className="mt-3 flex justify-end">
        <button type="button" className="px-4 py-2 rounded bg-blue-600 text-white" onClick={apply}>
          Search
        </button>
      </div>
    </div>
  )
}
