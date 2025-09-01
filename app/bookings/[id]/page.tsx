"use client"

import Link from "next/link"
import { useMemo } from "react"
import useSWR from "swr"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { firestore } from "@/lib/firebase"
import type { Booking } from "@/lib/types"

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const id = params.id
  const { data, isLoading } = useSWR<Booking | null>(["booking", id], async () => {
    const doc = await firestore.getBookingById(id)
    return doc as Booking | null
  })

  const title = useMemo(() => data?.service || "Booking", [data])

  return (
    <main className="font-sans">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/bookings" className="hover:text-foreground">
                Bookings
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="text-foreground">
              {id}
            </li>
          </ol>
        </nav>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-balance capitalize">{title}</CardTitle>
            <CardDescription>Track status, view details, and manage your booking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="rounded border p-4 text-sm text-muted-foreground">Loading booking…</div>
            ) : !data ? (
              <div className="rounded border p-4 text-sm text-muted-foreground">Booking not found.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded border p-3">
                    <h3 className="font-medium">Status</h3>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{data.status?.replace("_", " ")}</p>
                  </div>
                  <div className="rounded border p-3">
                    <h3 className="font-medium">Schedule</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.schedule?.date || "—"} at {data.schedule?.time || "—"}
                    </p>
                  </div>
                  <div className="rounded border p-3">
                    <h3 className="font-medium">Address</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.address?.line1 || "—"}
                      {data.address?.line2 ? `, ${data.address?.line2}` : ""}
                      {data.address?.city ? `, ${data.address.city}` : ""}
                      {data.address?.state ? `, ${data.address.state}` : ""} {data.address?.postalCode || ""}
                    </p>
                  </div>
                  <div className="rounded border p-3">
                    <h3 className="font-medium">Details</h3>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{data.details || "—"}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/bookings">Back</Link>
                  </Button>
                  {/* Stubs for future actions */}
                  <Button variant="outline" disabled title="Coming soon">
                    Reschedule
                  </Button>
                  <Button variant="outline" disabled title="Coming soon">
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>
      <SiteFooter />
    </main>
  )
}
