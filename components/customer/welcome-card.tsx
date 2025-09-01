import { Card, CardContent } from "@/components/ui/card"

export function WelcomeCard({ name, location }: { name: string; location?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <h1 className="text-balance text-2xl font-semibold md:text-3xl">Welcome, {name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {location ? `Your location: ${location}.` : "Update your location for better matches."}
        </p>
      </CardContent>
    </Card>
  )
}
