"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getDb } from "@/lib/firebase-chat"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"

type BookingForm = {
  service: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  date: string
  time: string
  details: string
}

const SERVICES = [
  { id: "cleaning", name: "Home Cleaning" },
  { id: "plumbing", name: "Plumbing" },
  { id: "electrical", name: "Electrical" },
  { id: "moving", name: "Moving Help" },
  { id: "handyman", name: "Handyman" },
]

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>
        Step {step} of {total}
      </span>
      <div className="flex-1 h-1 bg-muted rounded">
        <div className="h-1 bg-blue-600 rounded" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  )
}

export default function NewBookingPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, profile } = useAuth()
  const prefillService = params.get("service") || ""

  const [step, setStep] = useState(1)
  const totalSteps = 6

  const [form, setForm] = useState<BookingForm>({
    service: prefillService,
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    date: "",
    time: "",
    details: "",
  })

  const [payment, setPayment] = useState<"card" | "wallet" | "cash">("card")

  const canContinue = useMemo(() => {
    if (step === 1) return !!form.service
    if (step === 2) return !!(form.addressLine1 && form.city && form.state && form.postalCode)
    if (step === 3) return !!(form.date && form.time)
    if (step === 4) return form.details.trim().length > 0
    if (step === 5) return !!payment
    return true
  }, [step, form, payment])

  const next = () => setStep((s) => Math.min(totalSteps, s + 1))
  const back = () => setStep((s) => Math.max(1, s - 1))

  async function handleConfirm() {
    if (!user) {
      router.push("/bookings")
      return
    }
    try {
      const db = getDb()
      const payload = {
        userId: user.uid,
        status: "requested", // requested -> accepted -> in_progress -> completed -> reviewed
        service: form.service,
        address: {
          line1: form.addressLine1,
          line2: form.addressLine2 || "",
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
        },
        schedule: {
          date: form.date,
          time: form.time,
        },
        details: form.details,
        paymentMethod: payment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      await addDoc(collection(db, "bookings"), payload)
      router.push("/bookings")
    } catch (e) {
      console.error("[v0] booking create error", e)
      // consider a toast here if your project has use-toast
      router.push("/bookings")
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="mb-4">
        <Link href="/bookings" className="text-sm text-blue-600 hover:underline">
          {"< Back to bookings"}
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-pretty">New Booking</CardTitle>
          <CardDescription>
            Select a service, set your address and schedule, choose payment method, then review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <StepIndicator step={step} total={totalSteps} />

          {step === 1 && (
            <section className="space-y-4" aria-labelledby="service-heading">
              <h2 id="service-heading" className="text-lg font-medium">
                Choose a service
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, service: s.id }))}
                    className={cn(
                      "rounded border p-3 text-left hover:border-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                      form.service === s.id ? "border-blue-600 bg-blue-50" : "border-border",
                    )}
                    aria-pressed={form.service === s.id}
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-muted-foreground">{"Select to continue"}</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4" aria-labelledby="address-heading">
              <h2 id="address-heading" className="text-lg font-medium">
                Service address
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="line1">Address line 1</Label>
                  <Input
                    id="line1"
                    placeholder="123 Main St"
                    value={form.addressLine1}
                    onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="line2">Address line 2 (optional)</Label>
                  <Input
                    id="line2"
                    placeholder="Apt, suite, etc."
                    value={form.addressLine2}
                    onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={form.state}
                      onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="postal">Postal code</Label>
                    <Input
                      id="postal"
                      value={form.postalCode}
                      onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4" aria-labelledby="schedule-heading">
              <h2 id="schedule-heading" className="text-lg font-medium">
                Schedule
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  />
                </div>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4" aria-labelledby="details-heading">
              <h2 id="details-heading" className="text-lg font-medium">
                Details
              </h2>
              <div className="grid gap-2">
                <Label htmlFor="details">Describe your request</Label>
                <Textarea
                  id="details"
                  placeholder="Tell us what needs to be done, any specifics, access instructions, etc."
                  value={form.details}
                  onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                  className="min-h-[120px]"
                />
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="space-y-4" aria-labelledby="payment-heading">
              <h2 id="payment-heading" className="text-lg font-medium">
                Payment
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setPayment("card")}
                  className={cn(
                    "rounded border p-3 text-left hover:border-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                    payment === "card" ? "border-blue-600 bg-blue-50" : "border-border",
                  )}
                  aria-pressed={payment === "card"}
                >
                  <div className="font-medium">Card</div>
                  <div className="text-sm text-muted-foreground">Credit / Debit</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPayment("wallet")}
                  className={cn(
                    "rounded border p-3 text-left hover:border-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                    payment === "wallet" ? "border-blue-600 bg-blue-50" : "border-border",
                  )}
                  aria-pressed={payment === "wallet"}
                >
                  <div className="font-medium">UPI / Wallet</div>
                  <div className="text-sm text-muted-foreground">UPI apps, wallets</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPayment("cash")}
                  className={cn(
                    "rounded border p-3 text-left hover:border-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                    payment === "cash" ? "border-blue-600 bg-blue-50" : "border-border",
                  )}
                  aria-pressed={payment === "cash"}
                >
                  <div className="font-medium">Cash</div>
                  <div className="text-sm text-muted-foreground">Pay after service</div>
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                This is a placeholder for payment integration. You can integrate Stripe or your PSP later.
              </p>
            </section>
          )}

          {step === 6 && (
            <section className="space-y-4" aria-labelledby="review-heading">
              <h2 id="review-heading" className="text-lg font-medium">
                Review and confirm
              </h2>
              <div className="rounded border p-4">
                <dl className="grid grid-cols-1 gap-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Service</dt>
                    <dd className="font-medium">{SERVICES.find((s) => s.id === form.service)?.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Address</dt>
                    <dd className="font-medium">
                      {form.addressLine1}
                      {form.addressLine2 ? `, ${form.addressLine2}` : ""}, {form.city}, {form.state} {form.postalCode}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Schedule</dt>
                    <dd className="font-medium">
                      {form.date} at {form.time}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Payment</dt>
                    <dd className="font-medium capitalize">{payment}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Details</dt>
                    <dd className="font-medium whitespace-pre-wrap">{form.details}</dd>
                  </div>
                </dl>
              </div>
              <p className="text-sm text-muted-foreground">
                Payment will be finalized after a provider accepts your request. You can chat and modify details from
                the booking page.
              </p>
            </section>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={back} disabled={step === 1}>
              Back
            </Button>
            {step < totalSteps ? (
              <Button onClick={next} disabled={!canContinue} className="bg-blue-600 hover:bg-blue-700">
                Continue
              </Button>
            ) : (
              <Button onClick={handleConfirm} className="bg-orange-500 hover:bg-orange-600">
                Confirm Booking
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
