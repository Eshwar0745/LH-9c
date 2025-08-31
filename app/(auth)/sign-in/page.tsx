"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { BrandSpinner } from "@/components/ui/brand-spinner"
import { RoleSwitcher } from "@/components/auth/role-switcher"
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"
import { getDb } from "@/lib/firebase"
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore"

type Mode = "login" | "register"
type Role = "customer" | "provider"

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login")
  const [role, setRole] = useState<Role>("customer")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const m = params.get("mode")
    if (m === "register") setMode("register")
  }, [params])

  const title = mode === "login" ? "Welcome back" : "Join Local Hands"
  const subtitle =
    mode === "login"
      ? "Sign in to continue booking and managing your services."
      : "Create your account to offer or book local services."

  async function ensureUserProfile(uid: string, data: { name?: string; email?: string; role: Role }) {
    const db = getDb()
    const ref = doc(db, "users", uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        name: data.name || "",
        email: data.email || "",
        role: data.role,
        createdAt: serverTimestamp(),
        verified: false,
        portfolio: [],
        availability: {},
        rating: 0,
        reviewsCount: 0,
      })
    }
  }

  function humanizeAuthError(err: any) {
    const code = err?.code || ""
    if (code.includes("auth/unauthorized-domain")) {
      return "Google Sign-in is not authorized for this domain. Add the current domain under Firebase Auth > Settings > Authorized domains."
    }
    if (code.includes("wrong-password")) return "Incorrect email or password."
    if (code.includes("user-not-found")) return "No account found with that email."
    if (code.includes("email-already-in-use")) return "Email already in use. Try signing in instead."
    if (code.includes("weak-password")) return "Password is too weak. Use at least 8 characters."
    return err?.message || "Authentication failed. Please try again."
  }

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    // client-side validation with smooth error feedback
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.")
      return
    }
    setLoading(true)
    setError(null)
    const auth = getAuth()
    try {
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (name) await updateProfile(cred.user, { displayName: name })
        await ensureUserProfile(cred.user.uid, { name, email, role })
        router.push(role === "provider" ? "/provider/dashboard" : "/dashboard")
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        await ensureUserProfile(cred.user.uid, { email, role })
        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(humanizeAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  async function onGoogle() {
    setLoading(true)
    setError(null)
    const auth = getAuth()
    try {
      const provider = new GoogleAuthProvider()
      // encourage account picker for better UX
      provider.setCustomParameters({ prompt: "select_account" })
      const cred = await signInWithPopup(auth, provider)
      await ensureUserProfile(cred.user.uid, {
        name: cred.user.displayName || "",
        email: cred.user.email || "",
        role,
      })
      router.push(role === "provider" ? "/provider/dashboard" : "/dashboard")
    } catch (err: any) {
      setError(humanizeAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] grid md:grid-cols-2 bg-background relative overflow-hidden">
      {/* Left: animated hero */}
      <div className="relative hidden md:block">
        <AnimatedBackground />
        <div className="absolute inset-0 p-8 flex flex-col justify-between text-white">
          <div className="space-y-3">
            <motion.h1
              className="text-3xl lg:text-4xl font-semibold text-balance"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Local Hands
            </motion.h1>
            <motion.p
              className="text-white/90 max-w-sm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Find trusted local pros or grow your business. Simple bookings, real-time chat, and verified providers.
            </motion.p>
          </div>
          <motion.div
            className="mt-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <IllustrationCard />
          </motion.div>
        </div>
      </div>

      {/* Right: glassmorphism auth card */}
      <div className="flex items-center justify-center p-6">
        <motion.div
          className={cn(
            "w-full max-w-md rounded-2xl border bg-white/70 dark:bg-black/30 backdrop-blur-md shadow-lg p-6 md:p-8",
          )}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6">
            <RoleSwitcher role={role} onChange={setRole} />
          </div>

          <div className="mb-6">
            <motion.h2
              className="text-2xl font-semibold text-balance"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {title}
            </motion.h2>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          <div className="grid gap-3 mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={onGoogle}
              className="relative group h-11 justify-start gap-3 border-muted/60 bg-transparent"
            >
              <span className="absolute inset-0 rounded-md group-hover:scale-[1.01] transition-transform" />
              <img src="/google-logo.png" alt="Google" className="h-5 w-5" />
              <span className="font-medium">Continue with Google</span>
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={onEmailSubmit} className="grid gap-4">
            <AnimatePresence initial={false} mode="wait">
              {mode === "register" && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="relative">
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="peer h-11"
                      required
                    />
                    <Label
                      htmlFor="name"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-background px-1 text-muted-foreground transition-all peer-focus:top-0 peer-focus:text-xs peer-focus:-translate-y-1 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm"
                    >
                      Name
                    </Label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="peer h-11"
                required
              />
              <Label
                htmlFor="email"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-background px-1 text-muted-foreground transition-all peer-focus:top-0 peer-focus:text-xs peer-focus:-translate-y-1 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm"
              >
                Email
              </Label>
            </div>

            <div className="relative">
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="peer h-11"
                required
                minLength={8}
              />
              <Label
                htmlFor="password"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-background px-1 text-muted-foreground transition-all peer-focus:top-0 peer-focus:text-xs peer-focus:-translate-y-1 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm"
              >
                Password
              </Label>
            </div>

            {error && (
              <motion.div
                role="alert"
                aria-live="polite"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <Button
                type="submit"
                className="h-11 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <BrandSpinner size={18} />
                    <span>{mode === "login" ? "Signing in..." : "Creating account..."}</span>
                  </span>
                ) : (
                  <span>{mode === "login" ? "Sign in" : "Create account"}</span>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-sm text-blue-600 hover:underline focus:outline-none"
              >
                {mode === "login" ? "Create an account" : "Have an account? Sign in"}
              </button>
            </div>

            <div className="mt-1">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Back to home
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

function IllustrationCard() {
  return (
    <div className="max-w-md">
      <div className="rounded-xl bg-white/10 backdrop-blur-md p-4 border border-white/15">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/20" />
          <div>
            <p className="text-white/90 font-medium">Hire trusted providers</p>
            <p className="text-white/70 text-sm">Cleaning • Handyman • Electrical • Plumbing</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="h-16 rounded-lg bg-white/10" />
          <div className="h-16 rounded-lg bg-white/10" />
          <div className="h-16 rounded-lg bg-white/10" />
        </div>
      </div>
    </div>
  )
}

function AnimatedBackground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_-20%_-10%,rgba(37,99,235,0.55),transparent_60%),radial-gradient(900px_600px_at_120%_110%,rgba(249,115,22,0.45),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-soft-light animate-mesh" />
    </div>
  )
}
