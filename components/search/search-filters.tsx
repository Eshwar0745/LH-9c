"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Category } from "@/lib/types"

const CATEGORIES: Category[] = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Gardening",
  "Carpentry",
  "Painting",
  "AC Repair",
  "Home Security",
]

export function SearchFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [location, setLocation] = useState(params.get("loc") || "")
  const [category, setCategory] = useState<string | undefined>(params.get("cat") || "All")
  const [q, setQ] = useState(params.get("q") || "")
  const [priceMin, setPriceMin] = useState(params.get("pmin") || "")
  const [priceMax, setPriceMax] = useState(params.get("pmax") || "")
  const [ratingMin, setRatingMin] = useState(params.get("rmin") || "")
  const [availableNow, setAvailableNow] = useState(params.get("avail") === "1")

  useEffect(() => {
    setLocation(params.get("loc") || "")
    setCategory(params.get("cat") || "All")
    setQ(params.get("q") || "")
    setPriceMin(params.get("pmin") || "")
    setPriceMax(params.get("pmax") || "")
    setRatingMin(params.get("rmin") || "")
    setAvailableNow(params.get("avail") === "1")
  }, [params])

  function apply() {
    const usp = new URLSearchParams()
    if (location) usp.set("loc", location)
    if (category !== "All") usp.set("cat", category!)
    if (q) usp.set("q", q)
    if (priceMin) usp.set("pmin", priceMin)
    if (priceMax) usp.set("pmax", priceMax)
    if (ratingMin) usp.set("rmin", ratingMin)
    if (availableNow) usp.set("avail", "1")
    router.push(`/search${usp.toString() ? `?${usp.toString()}` : ""}`)
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="loc">Location</Label>
            <Input
              id="loc"
              placeholder="e.g., Andheri West"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v)}>
              <SelectTrigger id="cat" aria-label="Category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="q">Search</Label>
            <div className="flex gap-2">
              <Input
                id="q"
                placeholder="Name or keyword"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
              />
              <button
                onClick={apply}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                aria-label="Apply filters"
              >
                Search
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="pmin">Min Price</Label>
            <Input id="pmin" placeholder="₹" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pmax">Max Price</Label>
            <Input id="pmax" placeholder="₹" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rmin">Min Rating</Label>
            <select
              id="rmin"
              className="h-10 rounded border border-gray-300 px-3"
              value={ratingMin}
              onChange={(e) => setRatingMin(e.target.value)}
            >
              <option value="">Any</option>
              <option value="4.5">4.5+</option>
              <option value="4.0">4.0+</option>
              <option value="3.5">3.5+</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="avail">Availability</Label>
            <div className="flex h-10 items-center gap-2 rounded border border-gray-300 px-3">
              <input
                id="avail"
                type="checkbox"
                checked={availableNow}
                onChange={(e) => setAvailableNow(e.target.checked)}
                aria-label="Available now"
              />
              <span className="text-sm">Available now</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
