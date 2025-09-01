"use client"

import useSWR from "swr"
import type { Booking } from "@/lib/types"
import { firestore } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"

export function useBookings() {
  const { user } = useAuth()
  const { data, error, isLoading, mutate } = useSWR<Booking[]>(user ? ["bookings", user.uid] : null, async () => {
    const list = await firestore.listBookingsByUser(user!.uid)
    // ensure consistent shape
    return (list as Booking[]).sort((a, b) => {
      const at = (a.createdAt?.toMillis?.() ?? 0) as number
      const bt = (b.createdAt?.toMillis?.() ?? 0) as number
      return bt - at
    })
  })

  return {
    data: data || [],
    isLoading,
    error: error as Error | undefined,
    refresh: mutate,
  }
}
