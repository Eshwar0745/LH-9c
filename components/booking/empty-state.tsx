export function BookingEmptyState() {
  return (
    <div className="text-center p-8 border rounded">
      <h3 className="text-lg font-semibold mb-2">No active bookings yet</h3>
      <p className="text-sm text-muted-foreground mb-4">Create your first request to get matched with providers.</p>
      <a
        href="/book/new"
        className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
      >
        New booking
      </a>
    </div>
  )
}
