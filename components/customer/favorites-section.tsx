import { Card, CardContent } from "@/components/ui/card"
import { ProviderCard } from "@/components/shared/provider-card"

const FAVS = [
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
]

export function FavoritesSection() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Favorite providers</h2>
          <span className="text-xs text-muted-foreground">2 saved</span>
        </div>
        <div className="grid gap-3">
          {FAVS.map((p) => (
            <div key={p.name} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ProviderCard {...p} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
