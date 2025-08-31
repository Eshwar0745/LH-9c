"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"

export function SiteHeader() {
  const [open, setOpen] = useState(false)
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

          <nav className="hidden items-center gap-6 md:flex">
            <div className="group relative">
              <button className="inline-flex items-center gap-1 text-sm font-medium hover:text-blue-600">
                For Customers <ChevronDown className="h-4 w-4" />
              </button>
              <div className="invisible absolute left-0 mt-2 w-56 translate-y-1 rounded-md border bg-background p-2 opacity-0 shadow-md transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <Link href="/search" className="block rounded px-2 py-2 text-sm hover:bg-muted">
                  Find Services
                </Link>
                <Link href="/bookings" className="block rounded px-2 py-2 text-sm hover:bg-muted">
                  My Bookings
                </Link>
                <Link href="/favorites" className="block rounded px-2 py-2 text-sm hover:bg-muted">
                  Favorite Providers
                </Link>
              </div>
            </div>
            <div className="group relative">
              <button className="inline-flex items-center gap-1 text-sm font-medium hover:text-blue-600">
                For Providers <ChevronDown className="h-4 w-4" />
              </button>
              <div className="invisible absolute left-0 mt-2 w-56 translate-y-1 rounded-md border bg-background p-2 opacity-0 shadow-md transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <Link href="/provider" className="block rounded px-2 py-2 text-sm hover:bg-muted">
                  Provider Dashboard
                </Link>
                <Link href="/provider/portfolio" className="block rounded px-2 py-2 text-sm hover:bg-muted">
                  Manage Portfolio
                </Link>
                <Link href="/provider/schedule" className="block rounded px-2 py-2 text-sm hover:bg-muted">
                  Availability
                </Link>
              </div>
            </div>
            <Link href="/admin" className="text-sm font-medium hover:text-blue-600">
              Admin
            </Link>
            <Link href="/#how-it-works" className="text-sm font-medium hover:text-blue-600">
              How it works
            </Link>
            <Link href="/#categories" className="text-sm font-medium hover:text-blue-600">
              Categories
            </Link>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" className="text-sm" onClick={() => setOpen(true)}>
              Sign in
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setOpen(true)}>
              Join now
            </Button>
          </div>

          <button className="md:hidden" aria-label={open ? "Close Menu" : "Open Menu"} onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden">
            <div className="space-y-1 border-t p-2">
              <Link href="/search" className="block rounded px-3 py-2 text-sm hover:bg-muted">
                Find Services
              </Link>
              <Link href="/bookings" className="block rounded px-3 py-2 text-sm hover:bg-muted">
                My Bookings
              </Link>
              <Link href="/favorites" className="block rounded px-3 py-2 text-sm hover:bg-muted">
                Favorite Providers
              </Link>
              <Link href="/provider" className="block rounded px-3 py-2 text-sm hover:bg-muted">
                Provider Dashboard
              </Link>
              <Link href="/admin" className="block rounded px-3 py-2 text-sm hover:bg-muted">
                Admin
              </Link>
              <div className="flex gap-2 px-3 py-2">
                <Button variant="ghost" className="flex-1 text-sm" onClick={() => setOpen(true)}>
                  Sign in
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setOpen(true)}>
                  Join now
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      <AuthModal open={open} onOpenChange={setOpen} />
    </>
  )
}
