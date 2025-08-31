import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, Clock, Phone } from "lucide-react"
import { useBookings } from "@/hooks/use-bookings"
import type { BookingStatus } from "@/lib/types"

type Booking = {
  id: string
  title: string
  date: string
  time: string
  provider: string
  status: BookingStatus
  phone?: string
  service?: string
  schedule?: {
    date: string
    time: string
  }
}

const statusToStep: Record<BookingStatus, number> = {
  requested: 1,
  accepted: 2,
  enroute: 3,
  in_progress: 4,
  completed: 5,
}

const SERVICE_LABEL: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  cleaning: "Cleaning",
  moving: "Moving Help",
  handyman: "Handyman",
  "ac repair": "AC Repair",
  "ac-repair": "AC Repair",
}

export function ActiveBookingsCard() {
  const { data, isLoading } = useBookings()
  const active = (data || []).filter((b) => b.status !== "completed")

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active bookings</h2>
          <Button variant="outline" size="sm">
            View all
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded border p-4 text-sm text-muted-foreground">Loading your bookings…</div>
        ) : active.length === 0 ? (
          <div className="rounded border p-4 text-sm text-muted-foreground">No active bookings yet.</div>
        ) : (
          <div className="space-y-4">
            {active.map((b) => {
              const step = statusToStep[b.status]
              const percent = (step / 5) * 100
              const title = SERVICE_LABEL[b.service?.toLowerCase?.()] || b.service || "Service"
              return (
                <div key={b.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center">
                          <CalendarDays className="mr-1 h-4 w-4" />
                          {b.schedule?.date || "TBD"}
                        </span>
                        <span className="inline-flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          {b.schedule?.time || "TBD"}
                        </span>
                        {b.provider ? <span>Provider: {b.provider}</span> : null}
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 ring-1 ring-blue-100">
                          {b.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Phone className="mr-1 h-4 w-4" /> Contact
                      </Button>
                      <Button asChild size="sm" className="bg-orange-500 text-white hover:bg-orange-600">
                        <a href={`/bookings/${b.id}`}>View details</a>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={percent} aria-label={`Booking progress ${percent}%`} />
                    <div className="mt-1 text-xs text-muted-foreground">Status: {b.status.replace("_", " ")}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
