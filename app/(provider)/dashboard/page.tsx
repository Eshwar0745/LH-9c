"use client"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProviderOverviewCard } from "@/components/provider/overview-card"
import { PortfolioManager } from "@/components/provider/portfolio-manager"
import { AvailabilityEditor } from "@/components/provider/availability-editor"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function ProviderDashboardPage() {
  const { user, profile, loading } = useAuth()

  if (loading || !user || profile?.role !== "provider") {
    return (
      <main className="font-sans">
        <SiteHeader />
        <section className="mx-auto max-w-6xl px-4 py-8">
          <Card>
            <CardContent className="p-5">
              <h1 className="text-balance text-2xl font-semibold md:text-3xl">
                {loading ? "Loading…" : !user ? "Sign in required" : "Provider access only"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading
                  ? "Please wait while we load your account."
                  : !user
                    ? "Please sign in to access the provider dashboard."
                    : "Your account is not set as a provider."}
              </p>
              <div className="mt-3">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Go to home
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
        <SiteFooter />
      </main>
    )
  }

  return (
    <main className="font-sans">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-balance text-2xl font-semibold md:text-3xl">Provider dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your work, showcase your portfolio, and set availability.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6">
          <ProviderOverviewCard />
          <PortfolioManager />
          <AvailabilityEditor />
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
