import { Search, CalendarCheck, Handshake } from "lucide-react"

const steps = [
  { title: "Search", desc: "Find services and compare providers near you.", icon: Search },
  { title: "Book", desc: "Pick a time, confirm details, and pay securely.", icon: CalendarCheck },
  { title: "Get Service", desc: "Your pro arrives on time and gets it done.", icon: Handshake },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-balance text-2xl font-semibold md:text-3xl">How it works</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {steps.map(({ title, desc, icon: Icon }) => (
            <div key={title} className="rounded-lg border bg-card p-5 shadow-sm">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
