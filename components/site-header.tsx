"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuth } from "@/hooks/use-auth"

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <Link href="/" className="flex items-center gap-2" aria-label="Local Hands Home">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
              LH
            </span>
            <span className="text-lg font-semibold tracking-tight">Local Hands</span>
          </Link>

          {/* navigation kept same */}

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <span className="text-sm">{user.email}</span>
                <Button variant="ghost" className="text-sm" onClick={() => signOut()}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-sm" onClick={() => setOpen(true)}>
                  Sign in
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setOpen(true)}>
                  Join now
                </Button>
              </>
            )}
          </div>

          <button className="md:hidden" aria-label={open ? "Close Menu" : "Open Menu"} onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>
      <AuthModal open={open} onOpenChange={setOpen} />
    </>
  )
}
