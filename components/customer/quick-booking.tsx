"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useRouter } from "next/navigation"

const categories = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Gardening",
  "Carpentry",
  "Painting",
  "AC Repair",
  "Home Security",
]

const serviceIdMap: Record<string, string> = {
  Plumbing: "plumbing",
  Electrical: "electrical",
  Cleaning: "cleaning",
}

export function QuickBooking() {
  const router = useRouter()
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState<string | undefined>(undefined)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const serviceId = category ? serviceIdMap[category] : undefined
    const url = serviceId ? `/book/new?service=${encodeURIComponent(serviceId)}` : "/book/new"
    router.push(url)
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold">Quick booking</h2>
        <p className="text-sm text-muted-foreground">Book popular services in a few clicks</p>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              placeholder="e.g., Andheri West"
              aria-label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger aria-label="Service category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700">
              Find providers
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
