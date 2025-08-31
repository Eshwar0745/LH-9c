export function AppCTA() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid items-center gap-6 rounded-lg border bg-card p-6 shadow-sm md:grid-cols-2">
          <div>
            <h2 className="text-balance text-2xl font-semibold md:text-3xl">Get the app</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Book faster, track your bookings, and chat with providers on the go.
            </p>
            <div className="mt-4 flex gap-3">
              <img src="/download-on-app-store.png" alt="Download on the App Store" className="h-12 w-auto" />
              <img src="/get-it-on-google-play.png" alt="Get it on Google Play" className="h-12 w-auto" />
            </div>
          </div>
          <div className="justify-self-end">
            <img
              src="/mobile-app-mockup.png"
              alt="Local Hands app mockup"
              className="h-auto w-72 rounded-md border object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
