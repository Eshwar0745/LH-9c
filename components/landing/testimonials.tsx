import { Card, CardContent } from "@/components/ui/card"

const testimonials = [
  {
    name: "Kavya",
    text: "Booked a plumber in minutes. Transparent pricing and great service!",
    avatar: "/customer-avatar.png",
  },
  {
    name: "Rohit",
    text: "The electrician arrived on time and fixed everything efficiently.",
    avatar: "/customer-avatar.png",
  },
  {
    name: "Aisha",
    text: "Loved the chat feature and quick booking experience.",
    avatar: "/customer-avatar.png",
  },
]

export function Testimonials() {
  return (
    <section className="bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-balance text-2xl font-semibold md:text-3xl">What customers say</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar || "/placeholder.svg"}
                    alt={`${t.name} avatar`}
                    className="h-10 w-10 rounded-full"
                  />
                  <div className="font-medium">{t.name}</div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{t.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
