import { Star, Shield, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ProviderCardProps = {
  name: string
  rating: number
  reviews: number
  specialization: string
  priceFrom: number
  distanceKm: number
  availableNow?: boolean
  verified?: boolean
  imageUrl?: string
}

export function ProviderCard({
  name,
  rating,
  reviews,
  specialization,
  priceFrom,
  distanceKm,
  availableNow,
  verified,
  imageUrl = "/professional-portrait.png",
}: ProviderCardProps) {
  return (
    <Card className="group h-full transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fade-up">
      <CardHeader className="p-0 overflow-hidden">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={`Photo of ${name}`}
          className="h-40 w-full rounded-t-lg object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">{name}</div>
          {verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 ring-1 ring-blue-100">
              <Shield className="h-3.5 w-3.5 animate-verify-pulse" /> Verified
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center text-orange-600">
            <Star className="mr-1 h-4 w-4 fill-orange-500 text-orange-500" /> {rating.toFixed(1)}
          </span>
          <span className="text-muted-foreground">({reviews})</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{specialization}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>From ₹{priceFrom}</span>
          <span className="inline-flex items-center text-muted-foreground">
            <MapPin className="mr-1 h-4 w-4" /> {distanceKm} km
          </span>
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="transition-all active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-blue-600 bg-transparent"
          >
            View Profile
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Book Now
          </Button>
        </div>
        {availableNow && (
          <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 ring-1 ring-blue-100">
            Available Now
          </span>
        )}
      </CardContent>
    </Card>
  )
}
