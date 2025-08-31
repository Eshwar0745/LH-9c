"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { Star } from "lucide-react"
import { useBookings } from "@/hooks/use-bookings" // pull real bookings from Firestore

const SERVICE_LABEL: Record<string, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  cleaning: "Cleaning",
  moving: "Moving Help",
  handyman: "Handyman",
  "ac repair": "AC Repair",
  "ac-repair": "AC Repair",
}

export function BookingHistory() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<{ id: string; provider?: string } | null>(null)
  const [stars, setStars] = useState(0)

  const { data, isLoading } = useBookings()
  const history = (data || [])
    .filter((b: any) => b.status === "completed")
    .sort((a: any, b: any) => {
      const at = a.createdAt?.toMillis?.() ?? 0
      const bt = b.createdAt?.toMillis?.() ?? 0
      return bt - at
    })

  const onRate = (b: any) => {
    setSelected({ id: b.id, provider: b.provider })
    setStars(b.rating || 0)
    setOpen(true)
  }

  const submitRating = () => {
    setOpen(false)
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold">Booking history</h2>

        {isLoading ? (
          <div className="mt-3 rounded border p-4 text-sm text-muted-foreground">Loading your history…</div>
        ) : history.length === 0 ? (
          <div className="mt-3 rounded border p-4 text-sm text-muted-foreground">No completed bookings yet.</div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">Service</th>
                  <th className="px-2 py-2">Provider</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Rating</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {history.map((b: any) => {
                  const title = SERVICE_LABEL[b.service?.toLowerCase?.()] || b.service || "Service"
                  const dt = b.schedule?.date || "—"
                  const amt = b.amount ?? "—"
                  const rating = b.rating || 0
                  return (
                    <tr key={b.id} className="border-b">
                      <td className="px-2 py-2">{b.id}</td>
                      <td className="px-2 py-2">{title}</td>
                      <td className="px-2 py-2">{b.provider || "—"}</td>
                      <td className="px-2 py-2">{dt}</td>
                      <td className="px-2 py-2">{typeof amt === "number" ? `₹${amt}` : amt}</td>
                      <td className="px-2 py-2">
                        <StarRow value={rating} readOnly />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => onRate(b)}>
                          {rating ? "Edit rating" : "Rate"}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate your service</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-sm">How was your experience with {selected?.provider || "the provider"}?</div>
              <StarRow value={stars} onChange={setStars} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={submitRating}>
                  Submit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

function StarRow({ value, onChange, readOnly }: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => (
        <button
          key={s}
          aria-label={`Rate ${s} stars`}
          className="p-1"
          onClick={readOnly ? undefined : () => onChange?.(s)}
          disabled={readOnly}
        >
          <Star className={`h-5 w-5 ${s <= value ? "fill-orange-500 text-orange-500" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  )
}
