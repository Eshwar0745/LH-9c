import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ActiveBookingsCard } from "@/components/customer/active-bookings-card"
import { BookingHistory } from "@/components/customer/booking-history"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export default function BookingsPage() {
  return (
    <main className="font-sans">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="text-foreground">
              Bookings
            </li>
          </ol>
        </nav>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-balance text-2xl font-semibold md:text-3xl">Your bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track active services, review past jobs, and manage your appointments.
            </p>
          </div>
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
            <Link href="/book/new">New booking</Link>
          </Button>
        </div>

        <div className="mt-6">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full max-w-sm grid-cols-2">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-4">
              <ActiveBookingsCard />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <BookingHistory />
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
