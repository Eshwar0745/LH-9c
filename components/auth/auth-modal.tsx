"use client"

import { useState } from "react"
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { firebaseClient } from "@/lib/firebase"

interface AuthModalProps {
  open: boolean
  onOpenChange: (val: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, user } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    try {
      if (isReset) {
        await firebaseClient.sendPasswordReset(email)
        setMessage("Password reset link sent to your email.")
        return
      }
      if (isSignUp) {
        await signUpWithEmail(email, password, name)
        setMessage("Account created! Please check your email to verify your account.")
        return // don't auto-close modal
      } else {
        await signInWithEmail(email, password)
        onOpenChange(false)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleResendVerification = async () => {
    try {
      if (user) {
        await firebaseClient.sendEmailVerificationLink(user)
        setMessage("Verification email re-sent. Please check your inbox.")
      } else {
        setError("Please sign in first to resend verification.")
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <DialogPanel className="w-full max-w-md rounded bg-white p-6">
        <DialogTitle className="text-lg font-semibold mb-4">
          {isReset ? "Reset Password" : isSignUp ? "Join Now" : "Sign In"}
        </DialogTitle>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isSignUp && !isReset && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 rounded"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded"
            required
          />
          {!isReset && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 rounded"
              required={isSignUp || !isReset}
            />
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <Button type="submit" className="bg-blue-600 text-white">
            {isReset ? "Send Reset Link" : isSignUp ? "Join Now" : "Sign In"}
          </Button>
        </form>

        {!isReset && (
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="outline" onClick={() => signInWithGoogle()}>
              Continue with Google
            </Button>
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Already have an account? Sign in" : "New here? Join now"}
            </button>
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setIsReset(true)}
            >
              Forgot password?
            </button>
          </div>
        )}

        {isSignUp && !isReset && (
          <button
            className="mt-3 text-sm text-blue-600 hover:underline"
            onClick={handleResendVerification}
          >
            Resend verification email
          </button>
        )}

        {isReset && (
          <button
            className="mt-3 text-sm text-blue-600 hover:underline"
            onClick={() => {
              setIsReset(false)
              setMessage("")
              setError("")
            }}
          >
            Back to Sign In
          </button>
        )}
      </DialogPanel>
    </Dialog>
  )
}
