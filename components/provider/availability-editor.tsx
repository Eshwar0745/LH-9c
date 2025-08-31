"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { firestore } from "@/lib/firebase"
import type { WeeklyAvailability, AvailabilityDay } from "@/lib/types"
import { useMemo, useState } from "react"

const DAYS: (keyof WeeklyAvailability)[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

function defaultDay(): AvailabilityDay {
  return { enabled: false, start: "09:00", end: "17:00" }
}

function defaultAvailability(): WeeklyAvailability {
  return {
    mon: defaultDay(),
    tue: defaultDay(),
    wed: defaultDay(),
    thu: defaultDay(),
    fri: defaultDay(),
    sat: defaultDay(),
    sun: defaultDay(),
  }
}

export function AvailabilityEditor() {
  const { user, profile, refreshProfile } = useAuth()
  const initial = useMemo<WeeklyAvailability>(() => profile?.availability || defaultAvailability(), [profile])
  const [avail, setAvail] = useState<WeeklyAvailability>(initial)
  const [saving, setSaving] = useState(false)

  function update(day: keyof WeeklyAvailability, patch: Partial<AvailabilityDay>) {
    setAvail((a) => ({ ...a, [day]: { ...a[day], ...patch } }))
  }

  async function save() {
    if (!user) return
    setSaving(true)
    try {
      await firestore.patchUserProfile(user.uid, { availability: avail })
      await refreshProfile?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Availability</h2>
          <Button onClick={save} className="bg-orange-500 hover:bg-orange-600 text-white" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Set your weekly working hours for customer bookings.</p>

        <div className="mt-4 space-y-3">
          {DAYS.map((d) => (
            <div key={d} className="grid items-center gap-3 sm:grid-cols-[100px_1fr_1fr_1fr]">
              <Label className="capitalize">{d}</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={avail[d].enabled}
                  onCheckedChange={(v) => update(d, { enabled: v })}
                  aria-label={`Enable ${d}`}
                />
                <span className="text-sm text-muted-foreground">{avail[d].enabled ? "Enabled" : "Disabled"}</span>
              </div>
              <div className="grid gap-1">
                <Label htmlFor={`${d}-start`} className="text-xs text-muted-foreground">
                  Start
                </Label>
                <Input
                  id={`${d}-start`}
                  type="time"
                  value={avail[d].start}
                  onChange={(e) => update(d, { start: e.target.value })}
                  disabled={!avail[d].enabled}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor={`${d}-end`} className="text-xs text-muted-foreground">
                  End
                </Label>
                <Input
                  id={`${d}-end`}
                  type="time"
                  value={avail[d].end}
                  onChange={(e) => update(d, { end: e.target.value })}
                  disabled={!avail[d].enabled}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
