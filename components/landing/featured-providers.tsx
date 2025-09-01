"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ProviderCard } from "@/components/shared/provider-card"
import { Button } from "@/components/ui/button"

const providers = [
  {
    name: "Aman Gupta",
    rating: 4.8,
    reviews: 214,
    specialization: "Plumbing",
    priceFrom: 499,
    distanceKm: 2.1,
    verified: true,
    availableNow: true,
  },
  {
    name: "Priya Sharma",
    rating: 4.9,
    reviews: 312,
    specialization: "Cleaning",
    priceFrom: 399,
    distanceKm: 3.4,
    verified: true,
  },
  {
    name: "Rahul Verma",
    rating: 4.7,
    reviews: 178,
    specialization: "Electrical",
    priceFrom: 699,
    distanceKm: 1.8,
    verified: true,
    availableNow: true,
  },
  {
    name: "Sneha Iyer",
    rating: 4.6,
    reviews: 142,
    specialization: "AC Repair",
    priceFrom: 799,
    distanceKm: 5.2,
    verified: true,
  },
  {
    name: "Arjun Mehta",
    rating: 4.8,
    reviews: 201,
    specialization: "Painting",
    priceFrom: 999,
    distanceKm: 4.6,
    verified: true,
  },
]

export function FeaturedProviders() {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollBy = (dx: number) => {
    scrollerRef.current?.scrollBy({ left: dx, behavior: "smooth" })
  }

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-balance text-2xl font-semibold md:text-3xl">Featured Providers</h2>
            <p className="text-sm text-muted-foreground">Top-rated professionals near you</p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <Button variant="outline" size="icon" aria-label="Scroll left" onClick={() => scrollBy(-320)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Scroll right" onClick={() => scrollBy(320)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
            role="list"
            aria-label="Featured Providers"
          >
            {providers.map((p) => (
              <div key={p.name} className="min-w-[280px] snap-start" role="listitem">
                <ProviderCard {...p} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2 sm:hidden">
            <Button variant="outline" size="icon" aria-label="Scroll left" onClick={() => scrollBy(-280)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Scroll right" onClick={() => scrollBy(280)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
