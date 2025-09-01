export default function Loading() {
  return (
    <main className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-72 bg-muted rounded-md" />
        <div className="h-72 md:col-span-2 bg-muted rounded-md" />
      </div>
    </main>
  )
}
