"use client"

import { useEffect, useState } from "react"
import { getDb } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from "firebase/firestore"

type Dispute = { id: string; bookingId: string; reason: string; status: "open" | "resolved"; createdAt?: any }

export function DisputesManager() {
  const [items, setItems] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const db = await getDb()
      const q = query(collection(db, "disputes"), orderBy("createdAt", "desc"), limit(50))
      const snap = await getDocs(q)
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Dispute[])
      setLoading(false)
    })()
  }, [])

  async function resolve(id: string) {
    const db = await getDb()
    await updateDoc(doc(db, "disputes", id), { status: "resolved" })
    setItems((arr) => arr.map((d) => (d.id === id ? { ...d, status: "resolved" } : d)))
  }

  if (loading) return <div className="h-24 rounded bg-gray-100 animate-pulse" />

  return (
    <div className="rounded border border-gray-200 p-4 bg-white">
      <h2 className="text-xl font-semibold mb-3">Disputes</h2>
      {!items.length ? (
        <p className="text-gray-600">No disputes.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((d) => (
            <li key={d.id} className="p-3 rounded border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-medium">Booking #{d.bookingId}</div>
                <div className="text-sm text-gray-700">Reason: {d.reason}</div>
                <div className={`text-sm ${d.status === "open" ? "text-orange-600" : "text-gray-700"}`}>
                  Status: {d.status}
                </div>
              </div>
              {d.status === "open" && (
                <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => resolve(d.id)}>
                  Mark resolved
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
