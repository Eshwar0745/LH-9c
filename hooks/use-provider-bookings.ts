"use client"

import useSWR from "swr"
import { firestore } from "@/lib/firebase"

export function useProviderBookings(providerId?: string) {
  const { data, error, isLoading, mutate } = useSWR(providerId ? ["provider-bookings", providerId] : null, () =>
    firestore.listBookingsByProvider(providerId!),
  )

  return {
    data: (data as any[]) || [],
    isLoading,
    error: error as Error | undefined,
    refresh: mutate,
  }
}
