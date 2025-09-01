"use client"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SearchFilters } from "@/components/search/search-filters"
import { ProviderGrid } from "@/components/search/provider-grid"

export default function SearchPage() {
  return (
    <main className="font-sans">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4">
          <h1 className="text-balance text-2xl font-semibold md:text-3xl">Find local pros</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search by category, location, or name to discover verified providers.
          </p>
        </div>

        <SearchFilters />

        <div className="mt-6 animate-fade-up">
          <ProviderGrid />
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
