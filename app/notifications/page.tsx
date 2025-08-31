"use client"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"

export default function NotificationsPage() {
  const { user } = useAuth()

  return (
    <main className="font-sans">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4">
          <h1 className="text-balance text-2xl font-semibold md:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stay updated on your bookings and messages.</p>
        </div>
        {!user ? (
          <Card>
            <CardContent className="p-5">Please sign in to view notifications.</CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            </CardContent>
          </Card>
        )}
      </section>
      <SiteFooter />
    </main>
  )
}
