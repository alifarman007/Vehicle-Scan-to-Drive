/*
 * Shapes the browser sees. They never include profile ids, and a trip's review
 * is only included when the viewer is that trip's passenger.
 */

export type Role = "driver" | "passenger"
export type TripStatus = "active" | "completed"

export type Me = {
  role: Role
  name: string
  code: string
  phone: string | null
  idNumber: string | null
  vehicleNo: string | null
}

export type TripReview = {
  rating: number
  tags: string[]
  comment: string | null
  reviewedAt: string
}

export type Trip = {
  id: string
  tripNo: number
  status: TripStatus
  startedAt: string
  endedAt: string | null
  vehicleNo: string | null
  driver: { name: string; phone: string | null }
  passenger: { name: string; phone: string | null; idNumber: string | null }
  /** Same-origin URL that redirects to a short-lived signed link. */
  photoUrl: string
  /** Which side of the trip the viewer is on. */
  viewerRole: Role
  /** Passenger only: completed and not yet rated. Always false for drivers. */
  canReview: boolean
  /** Passenger only. Always null for drivers so reviews stay honest. */
  review: TripReview | null
}

export type HomeState = {
  me: Me
  active: Trip[]
  recent: Trip[]
  /** Server clock (ms) when this was produced, for the live timers. */
  serverNow: number
}

/** GET /api/lookup?code=… — a driver checks a scanned passenger code. */
export type PassengerCheck = {
  code: string
  passenger: { name: string; idNumber: string | null; phone: string | null }
  /** Set when this driver already started a trip with this passenger. */
  existingTripId: string | null
}

/** POST /api/trips — start a trip (FormData: passengerCode, photo). */
export type StartTripResult = { trip: Trip; alreadyStarted: boolean }

/** POST /api/trips/end, POST /api/trips/[id]/review, GET /api/trips/[id]. */
export type TripResult = { trip: Trip }
