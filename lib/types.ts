export type UserRole = "customer" | "provider"

export interface AvailabilityDay {
  enabled: boolean
  start: string // "09:00"
  end: string // "17:00"
}

export interface WeeklyAvailability {
  mon: AvailabilityDay
  tue: AvailabilityDay
  wed: AvailabilityDay
  thu: AvailabilityDay
  fri: AvailabilityDay
  sat: AvailabilityDay
  sun: AvailabilityDay
}

export type Category =
  | "Plumbing"
  | "Electrical"
  | "Cleaning"
  | "Gardening"
  | "Carpentry"
  | "Painting"
  | "AC Repair"
  | "Home Security"

export interface UserProfile {
  uid: string
  role: UserRole
  email: string   
  name?: string
  phone?: string
  address?: string
  experience?: string
  documents?: string[] // storage URLs
  portfolio?: string[] // storage URLs
  availability?: WeeklyAvailability
  ratingAvg?: number
  ratingCount?: number
  categories?: Category[] // categories a provider offers (used for search filters)
  createdAt?: any
  updatedAt?: any
}

export type BookingStatus = "requested" | "accepted" | "enroute" | "in_progress" | "completed"

export interface Booking {
  id: string
  userId: string
  service: string // service id (e.g., "plumbing")
  status: BookingStatus
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
  }
  schedule?: {
    date?: string
    time?: string
  }
  details?: string
  providerId?: string
  createdAt?: any
  updatedAt?: any
  // optional review fields for history
  rating?: number
  review?: string
}
