import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Hero } from "@/components/landing/hero"
import { CategoriesGrid } from "@/components/landing/categories"
import { HowItWorks } from "@/components/landing/how-it-works"
import { FeaturedProviders } from "@/components/landing/featured-providers"
import { Testimonials } from "@/components/landing/testimonials"
import { AppCTA } from "@/components/landing/app-cta"

export default function HomePage() {
  return (
    <main className="font-sans">
      {/* Header */}
      <SiteHeader />

      {/* Hero */}
      <Hero />

      {/* Categories */}
      <CategoriesGrid />

      {/* How it works */}
      <HowItWorks />

      {/* Featured providers */}
      <FeaturedProviders />

      {/* Testimonials */}
      <Testimonials />

      {/* App CTA */}
      <AppCTA />

      {/* Footer */}
      <SiteFooter />
    </main>
  )
}
