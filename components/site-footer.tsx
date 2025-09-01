import Link from "next/link"
import { Lock, CheckCircle2, Shield } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
                LH
              </span>
              <span className="text-lg font-semibold">Local Hands</span>
            </div>
            <p className="text-sm text-muted-foreground">Find trusted professionals for every job, near you.</p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-blue-600">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-600">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-600">
                  Press
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-blue-600">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-600">
                  Safety & Trust
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-600">
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-blue-600">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-600">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-600">
                  Licenses
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t pt-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Local Hands. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Lock className="h-4 w-4" aria-hidden />
              Secure payments
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Verified providers
            </span>
            <span className="inline-flex items-center gap-1">
              <Shield className="h-4 w-4" aria-hidden />
              Customer protection
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
