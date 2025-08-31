import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function Hero() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
              Find Local Services Near You
            </h1>
            <p className="mt-4 text-pretty text-base text-muted-foreground md:text-lg">
              Trusted professionals for plumbing, cleaning, repairs, and more — book in minutes with transparent
              pricing.
            </p>
            <div className="mt-6 rounded-lg border bg-card p-3 shadow-sm">
              <form className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input placeholder="Location (e.g., Mumbai)" aria-label="Location" />
                <Input placeholder="Category (e.g., Plumbing)" aria-label="Category" />
                <div className="flex gap-2">
                  <Input placeholder="Keyword (e.g., AC repair)" aria-label="Keyword" />
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">Popular: Plumbing, Cleaning, AC Repair</p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="outline">Browse Categories</Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">Become a Provider</Button>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <img
              src="/service-professional-helping-customer.png"
              alt="A local professional helping a customer"
              className="h-auto w-full rounded-lg object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
