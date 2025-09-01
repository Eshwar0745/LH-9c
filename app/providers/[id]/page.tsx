"use client"

import useSWR from "swr"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { firestore } from "@/lib/firebase"
import type { WeeklyAvailability } from "@/lib/types"
import { Lightbox } from "@/components/ui/lightbox"
import { ReviewList } from "@/components/reviews/review-list"
import { ReviewForm } from "@/components/reviews/review-form"

export default function ProviderProfilePage({ params }: { params: { id: string } }) {
  const id = params.id
  const { data, isLoading } = useSWR(["provider", id], () => firestore.getUserProfile(id))

  const p: any = data

  return (
    <main className="font-sans">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/search" className="hover:text-foreground">
                Search
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="text-foreground">
              {p?.name || id}
            </li>
          </ol>
        </nav>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-balance">{p?.name || "Provider"}</CardTitle>
            <CardDescription>{p?.address || "Location not specified"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="rounded border p-4 text-sm text-muted-foreground">Loading profile…</div>
            ) : !p ? (
              <div className="rounded border p-4 text-sm text-muted-foreground">Provider not found.</div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded border p-3">
                    <div className="text-sm text-muted-foreground">Category</div>
                    <div className="mt-1 font-semibold">
                      {(p.categories && p.categories.join(", ")) || p.experience || "—"}
                    </div>
                  </div>
                  <div className="rounded border p-3">
                    <div className="text-sm text-muted-foreground">Rating</div>
                    <div className="mt-1 font-semibold">
                      {typeof p.ratingAvg === "number" ? p.ratingAvg.toFixed(1) : "—"}{" "}
                      <span className="text-sm text-muted-foreground">
                        {typeof p.ratingCount === "number" ? `(${p.ratingCount} reviews)` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="rounded border p-3">
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="mt-1 font-semibold">{p.phone || "—"}</div>
                  </div>
                </div>

                {/* Portfolio */}
                <div>
                  <h2 className="text-lg font-semibold">Portfolio</h2>
                  {Array.isArray(p.portfolio) && p.portfolio.length > 0 ? (
                    <div className="mt-3">
                      <Lightbox images={p.portfolio as string[]} />
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">No portfolio items yet.</p>
                  )}
                </div>

                {/* Availability */}
                <div>
                  <h2 className="text-lg font-semibold">Availability</h2>
                  {p.availability ? (
                    <AvailabilityTable availability={p.availability as WeeklyAvailability} />
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Availability not set.</p>
                  )}
                </div>

                {/* Reviews */}
                <div>
                  <h2 className="text-lg font-semibold">Reviews</h2>
                  <div className="mt-3">
                    <ReviewList providerId={id} />
                    <ReviewForm providerId={id} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
                    <Link href="/book/new">Request a booking</Link>
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

function AvailabilityTable({ availability }: { availability: WeeklyAvailability }) {
  const entries = Object.entries(availability) as [keyof WeeklyAvailability, any][]
  return (
    <div className="mt-2 overflow-x-auto rounded border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/40 text-left">
          <tr>
            <th className="px-3 py-2">Day</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Hours</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([day, d]) => (
            <tr key={day} className="border-t">
              <td className="px-3 py-2 capitalize">{day}</td>
              <td className="px-3 py-2">{d.enabled ? "Available" : "—"}</td>
              <td className="px-3 py-2">{d.enabled ? `${d.start} – ${d.end}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
