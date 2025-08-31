import { Wrench, Plug, Book as Broom, Leaf, Hammer, Paintbrush, Fan, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const categories = [
  { name: "Plumbing", icon: Wrench },
  { name: "Electrical", icon: Plug },
  { name: "Cleaning", icon: Broom },
  { name: "Gardening", icon: Leaf },
  { name: "Carpentry", icon: Hammer },
  { name: "Painting", icon: Paintbrush },
  { name: "AC Repair", icon: Fan },
  { name: "Home Security", icon: ShieldCheck },
]

export function CategoriesGrid() {
  return (
    <section id="categories" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-balance text-2xl font-semibold md:text-3xl">Popular Categories</h2>
        <p className="mt-2 text-sm text-muted-foreground">Book trusted professionals across these services</p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {categories.map(({ name, icon: Icon }) => (
            <Card key={name} className="transition hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  {name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Skilled and verified specialists near you.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
