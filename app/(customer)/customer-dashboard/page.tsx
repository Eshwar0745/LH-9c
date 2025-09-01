"use client"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { WelcomeCard } from "@/components/customer/welcome-card"
import { QuickBooking } from "@/components/customer/quick-booking"
import { ActiveBookingsCard } from "@/components/customer/active-bookings-card"
import { BookingHistory } from "@/components/customer/booking-history"
import { FavoritesSection } from "@/components/customer/favorites-section"
import { ProfileForm } from "@/components/customer/profile-form"

export default function CustomerDashboardPage() {
  return (
    <main className="font-sans">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <WelcomeCard name="Riya" location="Bengaluru" />
            <QuickBooking />
            <ActiveBookingsCard />
            <BookingHistory />
          </div>
          <aside className="space-y-6">
            <FavoritesSection />
            <ProfileForm />
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
