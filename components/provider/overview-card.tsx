"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useProviderBookings } from "@/hooks/use-provider-bookings"
import { useAuth } from "@/hooks/use-auth"

export function ProviderOverviewCard() {
  const { user, profile } = useAuth()
  const { data: bookings, isLoading } = useProviderBookings(user?.uid)

  const upcoming = (bookings || []).filter((b) => b.status !== "completed").length
  const completed = (bookings || []).filter((b) => b.status === "completed").length
  const ratingAvg = profile?.ratingAvg ?? 0
  const ratingCount = profile?.ratingCount ?? 0

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold">Overview</h2>
        {isLoading ? (
          <div className="mt-3 rounded border p-3 text-sm text-muted-foreground">Loading stats…</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded border p-3">
              <div className="text-sm text-muted-foreground">Upcoming jobs</div>
              <div className="mt-1 text-2xl font-semibold">{upcoming}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="mt-1 text-2xl font-semibold">{completed}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-sm text-muted-foreground">Rating</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="text-2xl font-semibold">{ratingAvg.toFixed(1)}</div>
                <Badge className="bg-orange-500 hover:bg-orange-600"> {ratingCount} reviews</Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
