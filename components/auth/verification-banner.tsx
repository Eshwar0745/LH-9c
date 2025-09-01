import { Alert, AlertDescription } from "@/components/ui/alert"
import { BadgeCheck } from "lucide-react"

export function VerificationBanner({ verified }: { verified?: boolean }) {
  if (verified) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-blue-50 p-2 text-blue-700 ring-1 ring-blue-100">
        <BadgeCheck className="h-4 w-4" />
        <span className="text-sm">Email verified</span>
      </div>
    )
  }
  return (
    <Alert>
      <AlertDescription>
        Please verify your email address to unlock all features. Check your inbox for a verification link.
      </AlertDescription>
    </Alert>
  )
}
