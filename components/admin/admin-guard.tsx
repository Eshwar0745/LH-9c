"use client"

import type React from "react"
import type { ReactNode } from "react"
import { useAuth } from "@/context/auth-context" // Assuming useAuth is a custom hook that provides auth state

interface AdminGuardProps {
  children: ReactNode
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { profile, loading } = useAuth() // Declare loading and profile using a custom hook

  // Render nothing while loading to prevent children from issuing Firestore queries before role is known.
  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Checking admin permissions...</div>
  }

  // If not an admin, block access with clear message.
  if (!profile || profile.role !== "admin") {
    return (
      <div className="p-4 rounded-md border border-destructive/20 bg-background">
        <h2 className="text-base font-medium text-foreground">Access denied</h2>
        <p className="text-sm text-muted-foreground">You must be signed in as an administrator to view this page.</p>
      </div>
    )
  }

  return <>{children}</>
}

export default AdminGuard
