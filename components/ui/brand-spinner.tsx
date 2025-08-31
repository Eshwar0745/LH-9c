"use client"

import { cn } from "@/lib/utils"

export function BrandSpinner({
  size = 20,
  className,
  label,
  live = "polite",
}: {
  size?: number
  className?: string
  label?: string
  live?: "polite" | "assertive"
}) {
  const base = (
    <span className={cn("inline-block relative", className)} style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
      <span className="absolute inset-[35%] rounded-full bg-blue-600/80" />
    </span>
  )

  // If a label is provided, expose as a live region for screen readers.
  if (label) {
    return (
      <span role="status" aria-live={live} aria-label={label} className="inline-flex items-center">
        {base}
      </span>
    )
  }

  // Decorative by default
  return (
    <span aria-hidden="true" className="inline-flex items-center">
      {base}
    </span>
  )
}
