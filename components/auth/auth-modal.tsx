"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { firebaseClient, firestore, storage } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

type AuthModalProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
}

type Role = "customer" | "provider"

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup" | "reset">("signin")
  const [role, setRole] = useState<Role>("customer")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2>(1) // for signup onboarding
  const [info, setInfo] = useState<{
    name?: string
    phone?: string
    address?: string
    experience?: string
    documentsFiles?: File[]
    portfolioFiles?: File[]
  }>({})
  const { toast } = useToast()

  const configured = firebaseClient.isConfigured

  const onGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      const user = await firebaseClient.signInWithGoogle()
      // Create minimal profile on first sign in if not present
      const existing = await firestore.getUserProfile(user.uid)
      if (!existing) {
        await firestore.upsertUserProfile({
          uid: user.uid,
          role: "customer", // default; user can switch in profile later
          name: user.displayName || "",
        })
      }
      toast({ title: "Signed in with Google" })
      onOpenChange(false)
    } catch (e: any) {
      const code = e?.code || ""
      if (code === "auth/unauthorized-domain") {
        setError(
          "Google Sign-in is not authorized for this domain. Add your current preview or custom domain to Firebase Auth > Authorized domains.",
        )
      } else {
        setError(e?.message || "Unable to sign in with Google")
      }
    } finally {
      setLoading(false)
    }
  }

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    // validate before hitting Firebase
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const user = await firebaseClient.signInWithEmail(email, password)
      // Optional: fetch profile for role routing
      // const profile = await firestore.getUserProfile(user.uid)
      toast({ title: "Signed in" })
      onOpenChange(false)
    } catch (e: any) {
      setError(e?.message || "Sign in failed")
    } finally {
      setLoading(false)
    }
  }

  const onStartSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    // validate sign up inputs
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const user = await firebaseClient.signUpWithEmail(email, password)
      // Create initial user profile document with selected role
      await firestore.upsertUserProfile({
        uid: user.uid,
        role,
        name: info.name,
        phone: info.phone,
        address: info.address,
      })
      // Email verification integration point
      // await firebaseClient.sendEmailVerificationLink(user)
      setStep(2)
      toast({ title: "Account created", description: "Complete onboarding to finish setup." })
    } catch (e: any) {
      setError(e?.message || "Sign up failed")
    } finally {
      setLoading(false)
    }
  }

  const onReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await firebaseClient.sendPasswordReset(email)
      setTab("signin")
    } catch (e: any) {
      setError(e?.message || "Unable to send reset email")
    } finally {
      setLoading(false)
    }
  }

  const onCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // In a real app, get the current user from Firebase Auth state
      const auth = await firebaseClient.getAuthClient()
      const user = auth.currentUser
      if (!user) throw new Error("No authenticated user")

      let documents: string[] | undefined
      let portfolio: string[] | undefined

      if (role === "provider") {
        if ((info as any).documentsFiles instanceof Array) {
          const files = (info as any).documentsFiles as File[]
          documents = await Promise.all(
            files.map((f) => storage.uploadFile(`users/${user.uid}/documents/${f.name}`, f)),
          )
        }
        if ((info as any).portfolioFiles instanceof Array) {
          const files = (info as any).portfolioFiles as File[]
          portfolio = await Promise.all(
            files.map((f) => storage.uploadFile(`users/${user.uid}/portfolio/${f.name}`, f)),
          )
        }
      }

      await firestore.upsertUserProfile({
        uid: user.uid,
        role,
        name: info.name,
        phone: info.phone,
        address: info.address,
        experience: info.experience,
        documents,
        portfolio,
      })

      toast({ title: "Profile saved", description: "Your onboarding is complete." })
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || "Unable to complete onboarding")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tab === "signin" ? "Welcome back" : tab === "signup" ? "Create your account" : "Reset password"}
          </DialogTitle>
          <DialogDescription>
            {tab === "signin" && "Sign in to continue booking services or managing your work."}
            {tab === "signup" && "Choose your role and complete onboarding to get started."}
            {tab === "reset" && "Enter your email and we'll send you a password reset link."}
          </DialogDescription>
        </DialogHeader>

        {!configured && (
          <Alert>
            <AlertDescription>
              Firebase is not configured. This UI is ready for integration. Add NEXT_PUBLIC_FIREBASE_* env vars in
              Project Settings.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="reset">Reset</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-4">
            <form className="space-y-3" onSubmit={onSignIn}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p role="alert" aria-live="polite" className="text-sm text-red-600 animate-fade-up">
                  {error}
                </p>
              )}
              <div className="flex items-center justify-between">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <Button type="button" variant="link" className="px-0" onClick={() => setTab("reset")}>
                  Forgot password?
                </Button>
              </div>
            </form>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent active:scale-[0.99] transition-transform"
                onClick={onGoogle}
                disabled={loading}
              >
                <span className="mr-2 inline-block h-4 w-4">
                  <img src="/google-logo.png" alt="" className="h-4 w-4" />
                </span>
                Continue with Google
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            {step === 1 && (
              <form className="space-y-3" onSubmit={onStartSignUp}>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as Role)} className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 rounded-md border p-3">
                      <RadioGroupItem value="customer" id="role-customer" />
                      <Label htmlFor="role-customer" className="cursor-pointer">
                        Customer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border p-3">
                      <RadioGroupItem value="provider" id="role-provider" />
                      <Label htmlFor="role-provider" className="cursor-pointer">
                        Service Provider
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Password</Label>
                  <Input
                    id="password2"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <p role="alert" aria-live="polite" className="text-sm text-red-600 animate-fade-up">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {loading ? "Creating account..." : "Continue"}
                </Button>
                <p className="text-xs text-muted-foreground">We'll ask a few details next to complete your profile.</p>
              </form>
            )}

            {step === 2 && <RoleOnboarding role={role} info={info} setInfo={setInfo} onSubmit={onCompleteOnboarding} />}
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent active:scale-[0.99] transition-transform"
                onClick={onGoogle}
                disabled={loading}
              >
                <span className="mr-2 inline-block h-4 w-4">
                  <img src="/google-logo.png" alt="" className="h-4 w-4" />
                </span>
                Continue with Google
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="reset" className="mt-4">
            <form className="space-y-3" onSubmit={onReset}>
              <div className="space-y-2">
                <Label htmlFor="email3">Email</Label>
                <Input id="email3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {error && (
                <p role="alert" aria-live="polite" className="text-sm text-red-600 animate-fade-up">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function RoleOnboarding({
  role,
  info,
  setInfo,
  onSubmit,
}: {
  role: "customer" | "provider"
  info: Record<string, any>
  setInfo: (v: any) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {role === "customer" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={info.name || ""}
              onChange={(e) => setInfo({ ...info, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={info.phone || ""}
              onChange={(e) => setInfo({ ...info, phone: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={info.address || ""}
              onChange={(e) => setInfo({ ...info, address: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferences">Preferences</Label>
            <Input id="preferences" placeholder="e.g., prefers morning appointments" />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="namep">Full Name</Label>
            <Input
              id="namep"
              value={info.name || ""}
              onChange={(e) => setInfo({ ...info, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phonep">Phone</Label>
            <Input
              id="phonep"
              value={info.phone || ""}
              onChange={(e) => setInfo({ ...info, phone: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="services">Services Offered</Label>
            <Input id="services" placeholder="e.g., Plumbing, AC Repair" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="experience">Experience (years)</Label>
            <Input
              id="experience"
              type="number"
              value={info.experience || ""}
              onChange={(e) => setInfo({ ...info, experience: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Documents (PDF/Images)</Label>
            {/* Integration point: upload to Firebase Storage at users/{uid}/documents/* */}
            <div className="rounded-md border p-3">
              <input
                type="file"
                multiple
                aria-label="Upload documents"
                onChange={(e) => setInfo({ ...info, documentsFiles: Array.from(e.target.files || []) })}
              />
              <p className="mt-1 text-xs text-muted-foreground">Drag & drop coming soon</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Portfolio Images</Label>
            {/* Integration point: upload to Firebase Storage at users/{uid}/portfolio/* */}
            <div className="rounded-md border p-3">
              <input
                type="file"
                multiple
                accept="image/*"
                aria-label="Upload portfolio images"
                onChange={(e) => setInfo({ ...info, portfolioFiles: Array.from(e.target.files || []) })}
              />
              <p className="mt-1 text-xs text-muted-foreground">Supports JPG/PNG</p>
            </div>
          </div>
        </>
      )}
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        Finish Onboarding
      </Button>
    </form>
  )
}
