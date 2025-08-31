"use client"

import useSWR from "swr"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { firestore } from "@/lib/firebase"

export function ProviderGrid() {
  const params = useSearchParams()
  const cat = params.get("cat") || ""
  const q = (params.get("q") || "").toLowerCase()
  const loc = (params.get("loc") || "").toLowerCase()

  const { data, isLoading, error } = useSWR(["providers", cat], () => firestore.listProviders(cat || undefined))

  const results =
    (data as any[])?.filter((p) => {
      const name = (p.name || "").toLowerCase()
      const addr = (p.address || "").toLowerCase()
      const exp = (p.experience || "").toLowerCase()
      const matchesText = !q || name.includes(q) || exp.includes(q)
      const matchesLoc = !loc || addr.includes(loc)
      return matchesText && matchesLoc
    }) || []

  return (
    <div>
      {isLoading ? (
        <div className="rounded border p-4 text-sm text-muted-foreground">Loading providers…</div>
      ) : error ? (
        <div className="rounded border p-4 text-sm text-muted-foreground">Failed to load providers.</div>
      ) : results.length === 0 ? (
        <div className="rounded border p-4 text-sm text-muted-foreground">No providers found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p: any) => (
            <Link key={p.id} href={`/providers/${p.uid || p.id}`} className="block">
              <Card className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold">{p.name || "Provider"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(p.categories && p.categories.join(" · ")) || p.experience || "—"}
                      </p>
                    </div>
                    {typeof p.ratingAvg === "number" && typeof p.ratingCount === "number" && (
                      <div className="text-right text-sm">
                        <div className="font-semibold text-orange-500">{p.ratingAvg.toFixed(1)}</div>
                        <div className="text-muted-foreground">{p.ratingCount} reviews</div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {p.address || "Location not specified"}
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700 ring-1 ring-blue-100">
                      View profile
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
