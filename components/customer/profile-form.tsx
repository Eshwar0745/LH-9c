"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VerificationBanner } from "@/components/auth/verification-banner"

export function ProfileForm() {
  // Integration: load/save Firebase user profile from 'users' collection
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">Profile</h2>
        <VerificationBanner verified={false} />
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Your name" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="+91" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Street, City" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="prefs">Preferences</Label>
            <Input id="prefs" placeholder="e.g., mornings preferred" />
          </div>
          <Button className="bg-blue-600 text-white hover:bg-blue-700">Save changes</Button>
          <p className="text-xs text-muted-foreground">
            Integration: On save, write to Firestore users/{"{uid}"} with role: "customer".
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
