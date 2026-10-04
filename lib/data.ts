import "server-only"

/*
 * All data access lives here, as plain functions, so the backend can be
 * swapped later without touching the UI. Every rule (who can scan what, one
 * active trip per passenger, who can end or review a trip) is enforced here.
 */

import { generateCode, normalizeCode } from "./codes"
import { MAX_PHOTO_BYTES, PHOTO_BUCKET, PHOTO_URL_TTL, RECENT_TRIPS_LIMIT } from "./config"
import { AppError } from "./errors"
import { MAX_COMMENT_LENGTH, tagsForRating } from "./review"
import { db } from "./supabase"
import type { HomeState, Me, Role, Trip, TripStatus } from "./types"

/**
 * Postgres turns the string 'now' into the database's current time when it
 * casts a value to timestamptz, so `ended_at: DB_NOW` records the server's
 * clock, never the phone's. (`started_at` uses the column default `now()`.)
 */
const DB_NOW = "now"

const PROFILE_COLUMNS = "id, code, role, name, phone, id_number, vehicle_no, created_at"
const TRIP_COLUMNS =
  "id, trip_no, status, started_at, ended_at, vehicle_no, start_photo_path, rating, review_tags, review_comment, reviewed_at, driver_id, passenger_id, driver:profiles!trips_driver_id_fkey(name, phone), passenger:profiles!trips_passenger_id_fkey(name, phone, id_number)"

export type Profile = {
  id: string
  code: string
  role: Role
  name: string
  phone: string | null
  idNumber: string | null
  vehicleNo: string | null
  createdAt: string
}

type ProfileRow = {
  id: string
  code: string
  role: string
  name: string
  phone: string | null
  id_number: string | null
  vehicle_no: string | null
  created_at: string
}

export type TripRow = {
  id: string
  trip_no: number
  status: string
  started_at: string
  ended_at: string | null
  vehicle_no: string | null
  start_photo_path: string
  rating: number | null
  review_tags: string[]
  review_comment: string | null
  reviewed_at: string | null
  driver_id: string
  passenger_id: string
  driver: { name: string; phone: string | null } | null
  passenger: { name: string; phone: string | null; id_number: string | null } | null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (value: string) => UUID_RE.test(value)

function fail(error: unknown, context: string): never {
  console.error(`[data] ${context}`, error)
  throw new AppError("server_error", 500)
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    code: row.code,
    role: row.role === "driver" ? "driver" : "passenger",
    name: row.name,
    phone: row.phone,
    idNumber: row.id_number,
    vehicleNo: row.vehicle_no,
    createdAt: row.created_at,
  }
}

/** The browser-safe view of the signed-in profile (no id). */
export function toMe(profile: Profile): Me {
  return {
    role: profile.role,
    name: profile.name,
    code: profile.code,
    phone: profile.phone,
    idNumber: profile.idNumber,
    vehicleNo: profile.vehicleNo,
  }
}

/** Browser-safe trip. Reviews are only ever shown to the trip's passenger. */
export function toTrip(row: TripRow, viewer: Profile): Trip {
  const viewerRole: Role = row.driver_id === viewer.id ? "driver" : "passenger"
  const isPassenger = viewerRole === "passenger"
  return {
    id: row.id,
    tripNo: row.trip_no,
    status: row.status === "completed" ? "completed" : ("active" satisfies TripStatus),
    startedAt: row.started_at,
    endedAt: row.ended_at,
    vehicleNo: row.vehicle_no,
    driver: { name: row.driver?.name ?? "", phone: row.driver?.phone ?? null },
    passenger: {
      name: row.passenger?.name ?? "",
      phone: row.passenger?.phone ?? null,
      idNumber: row.passenger?.id_number ?? null,
    },
    photoUrl: `/api/trips/${row.id}/photo`,
    viewerRole,
    canReview: isPassenger && row.status === "completed" && row.rating === null,
    review:
      isPassenger && row.rating !== null
        ? {
            rating: row.rating,
            tags: row.review_tags,
            comment: row.review_comment,
            reviewedAt: row.reviewed_at ?? row.ended_at ?? row.started_at,
          }
        : null,
  }
}

// ---------------------------------------------------------------------------
// Input cleaning

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : ""
}

export function cleanVehicleNo(value: unknown): string {
  return cleanText(value, 24).toUpperCase()
}

function cleanPhone(value: unknown): string | null {
  const phone = cleanText(value, 20).replace(/[^\d+\-\s()]/g, "").trim()
  return phone || null
}

// ---------------------------------------------------------------------------
// Profiles

export async function createProfile(input: {
  role: unknown
  name: unknown
  phone?: unknown
  idNumber?: unknown
  vehicleNo?: unknown
}): Promise<Profile> {
  const role = input.role === "driver" || input.role === "passenger" ? input.role : null
  if (!role) throw new AppError("invalid_input")

  const name = cleanText(input.name, 60)
  if (!name) throw new AppError("name_required")

  const vehicleNo = role === "driver" ? cleanVehicleNo(input.vehicleNo) : ""
  if (role === "driver" && !vehicleNo) throw new AppError("vehicle_required")

  const row = {
    role,
    name,
    phone: cleanPhone(input.phone),
    id_number: role === "passenger" ? cleanText(input.idNumber, 32) || null : null,
    vehicle_no: vehicleNo || null,
  }

  // Codes are random; on the rare clash with an existing code, draw again.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await db()
      .from("profiles")
      .insert({ ...row, code: generateCode() })
      .select(PROFILE_COLUMNS)
      .single()
    if (!error) return toProfile(data)
    if (error.code !== "23505") fail(error, "createProfile")
  }
  fail("code space exhausted after 5 attempts", "createProfile")
}

export async function getProfileById(id: string): Promise<Profile | null> {
  if (!isUuid(id)) return null
  const { data, error } = await db().from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle()
  if (error) fail(error, "getProfileById")
  return data ? toProfile(data) : null
}

export async function getProfileByCode(code: string): Promise<Profile | null> {
  const normalized = normalizeCode(code)
  if (!normalized) return null
  const { data, error } = await db()
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("code", normalized)
    .maybeSingle()
  if (error) fail(error, "getProfileByCode")
  return data ? toProfile(data) : null
}

/** Like getProfileByCode, but throws friendly errors for bad or unknown codes. */
export async function resolveCode(code: unknown): Promise<Profile> {
  const normalized = typeof code === "string" ? normalizeCode(code) : null
  if (!normalized) throw new AppError("code_invalid")
  const profile = await getProfileByCode(normalized)
  if (!profile) throw new AppError("code_not_found", 404)
  return profile
}

export async function updateVehicle(driver: Profile, vehicleNo: unknown): Promise<Profile> {
  if (driver.role !== "driver") throw new AppError("wrong_role", 403)
  const value = cleanVehicleNo(vehicleNo)
  if (!value) throw new AppError("vehicle_required")
  const { data, error } = await db()
    .from("profiles")
    .update({ vehicle_no: value })
    .eq("id", driver.id)
    .select(PROFILE_COLUMNS)
    .single()
  if (error) fail(error, "updateVehicle")
  return toProfile(data)
}

// ---------------------------------------------------------------------------
// Trips

async function findActiveTripForPassenger(passengerId: string): Promise<TripRow | null> {
  const { data, error } = await db()
    .from("trips")
    .select(TRIP_COLUMNS)
    .eq("passenger_id", passengerId)
    .eq("status", "active")
    .maybeSingle()
  if (error) fail(error, "findActiveTripForPassenger")
  return data
}

async function getTripRow(id: string): Promise<TripRow | null> {
  if (!isUuid(id)) return null
  const { data, error } = await db().from("trips").select(TRIP_COLUMNS).eq("id", id).maybeSingle()
  if (error) fail(error, "getTripRow")
  return data
}

/**
 * Checks a scanned code before a driver starts a trip. Returns the passenger,
 * plus the trip if this driver already started one with them (a retry).
 */
export async function checkPassengerForStart(
  driver: Profile,
  passengerCode: unknown
): Promise<{ passenger: Profile; existingTrip: TripRow | null }> {
  if (driver.role !== "driver") throw new AppError("wrong_role", 403)
  const passenger = await resolveCode(passengerCode)
  if (passenger.id === driver.id) throw new AppError("own_code")
  if (passenger.role !== "passenger") throw new AppError("expected_passenger_code")

  const active = await findActiveTripForPassenger(passenger.id)
  if (active && active.driver_id !== driver.id) throw new AppError("passenger_busy", 409)
  return { passenger, existingTrip: active }
}

async function isJpeg(photo: Blob): Promise<boolean> {
  const head = new Uint8Array(await photo.slice(0, 3).arrayBuffer())
  return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
}

/**
 * Starts a trip: validate → create the trip id → upload the photo → insert.
 * If the insert fails the photo is deleted again. Starting twice for the same
 * driver and passenger returns the running trip instead of failing.
 */
export async function startTrip(
  driver: Profile,
  input: { passengerCode: unknown; photo: unknown }
): Promise<{ trip: TripRow; alreadyStarted: boolean }> {
  const { passenger, existingTrip } = await checkPassengerForStart(driver, input.passengerCode)
  if (existingTrip) return { trip: existingTrip, alreadyStarted: true }

  const photo = input.photo
  if (!(photo instanceof Blob) || photo.size === 0) throw new AppError("photo_required")
  if (photo.size > MAX_PHOTO_BYTES) throw new AppError("photo_too_large", 413)
  if (!(await isJpeg(photo))) throw new AppError("invalid_input")

  const tripId = crypto.randomUUID()
  const path = `trips/${tripId}/start.jpg`
  const bucket = db().storage.from(PHOTO_BUCKET)

  const upload = await bucket.upload(path, photo, {
    contentType: "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  })
  if (upload.error) {
    console.error("[data] startTrip upload", upload.error)
    throw new AppError("upload_failed", 502)
  }

  const { data, error } = await db()
    .from("trips")
    .insert({
      id: tripId,
      driver_id: driver.id,
      passenger_id: passenger.id,
      vehicle_no: driver.vehicleNo,
      start_photo_path: path,
    })
    .select(TRIP_COLUMNS)
    .single()

  if (error) {
    // No SQLSTATE means the request itself failed and the row may exist:
    // keep the photo of a committed trip rather than delete its evidence.
    if (!error.code) {
      const committed = await getTripRow(tripId)
      if (committed) return { trip: committed, alreadyStarted: false }
    }
    const removed = await bucket.remove([path])
    if (removed.error) console.error("[data] startTrip cleanup", removed.error)
    // Unique violation: the passenger got an active trip a moment ago.
    if (error.code === "23505") {
      const raced = await findActiveTripForPassenger(passenger.id)
      if (raced?.driver_id === driver.id) return { trip: raced, alreadyStarted: true }
      throw new AppError("passenger_busy", 409)
    }
    fail(error, "startTrip insert")
  }
  return { trip: data, alreadyStarted: false }
}

/** Active trips for a driver (any number) or a passenger (at most one). */
export async function getActiveTrips(profile: Profile): Promise<TripRow[]> {
  const column = profile.role === "driver" ? "driver_id" : "passenger_id"
  const { data, error } = await db()
    .from("trips")
    .select(TRIP_COLUMNS)
    .eq(column, profile.id)
    .eq("status", "active")
    .order("started_at", { ascending: false })
  if (error) fail(error, "getActiveTrips")
  return data
}

/**
 * The passenger ends their active trip by scanning the driver's QR. Only the
 * trip's own driver QR works. `ended_at` comes from the database clock.
 */
export async function endTrip(passenger: Profile, driverCode: unknown): Promise<TripRow> {
  if (passenger.role !== "passenger") throw new AppError("wrong_role", 403)
  const driver = await resolveCode(driverCode)
  if (driver.id === passenger.id) throw new AppError("own_code")
  if (driver.role !== "driver") throw new AppError("expected_driver_code")

  const active = await findActiveTripForPassenger(passenger.id)
  if (!active) throw new AppError("no_active_trip", 409)
  if (active.driver_id !== driver.id) throw new AppError("wrong_driver", 403)

  const { data, error } = await db()
    .from("trips")
    .update({ status: "completed", ended_at: DB_NOW })
    .eq("id", active.id)
    .eq("status", "active")
    .select(TRIP_COLUMNS)
    .maybeSingle()
  if (error) fail(error, "endTrip")
  if (data) return data

  // Completed by a parallel request in the meantime: return the final state.
  const trip = await getTripRow(active.id)
  if (trip?.status === "completed") return trip
  fail("trip vanished while ending", "endTrip")
}

/** One review per trip, by its passenger, after it has ended. */
export async function submitReview(
  passenger: Profile,
  tripId: string,
  input: { rating: unknown; tags: unknown; comment: unknown }
): Promise<TripRow> {
  if (passenger.role !== "passenger") throw new AppError("wrong_role", 403)
  const trip = await getTripRow(tripId)
  if (!trip || trip.passenger_id !== passenger.id) throw new AppError("trip_not_found", 404)
  if (trip.status !== "completed") throw new AppError("trip_not_completed", 409)
  if (trip.rating !== null) throw new AppError("already_reviewed", 409)

  const rating =
    typeof input.rating === "number" && Number.isInteger(input.rating) && input.rating >= 1 && input.rating <= 5
      ? input.rating
      : null
  if (rating === null) throw new AppError("rating_required")

  const allowed: readonly string[] = tagsForRating(rating)
  const tags = Array.isArray(input.tags)
    ? [...new Set(input.tags.filter((t): t is string => typeof t === "string" && allowed.includes(t)))]
    : []
  const comment =
    typeof input.comment === "string" ? input.comment.trim().slice(0, MAX_COMMENT_LENGTH) || null : null

  const { data, error } = await db()
    .from("trips")
    .update({ rating, review_tags: tags, review_comment: comment, reviewed_at: DB_NOW })
    .eq("id", trip.id)
    .eq("passenger_id", passenger.id)
    .eq("status", "completed")
    .is("rating", null)
    .select(TRIP_COLUMNS)
    .maybeSingle()
  if (error) fail(error, "submitReview")
  if (!data) throw new AppError("already_reviewed", 409)
  return data
}

/** Most recent trips for this profile, newest first. */
export async function listTrips(profile: Profile, limit = RECENT_TRIPS_LIMIT): Promise<TripRow[]> {
  const column = profile.role === "driver" ? "driver_id" : "passenger_id"
  const { data, error } = await db()
    .from("trips")
    .select(TRIP_COLUMNS)
    .eq(column, profile.id)
    .order("started_at", { ascending: false })
    .limit(limit)
  if (error) fail(error, "listTrips")
  return data
}

/** A trip, but only if the viewer is its driver or passenger. */
export async function getTrip(id: string, viewer: Profile): Promise<TripRow | null> {
  const trip = await getTripRow(id)
  if (!trip) return null
  if (trip.driver_id !== viewer.id && trip.passenger_id !== viewer.id) return null
  return trip
}

/** Short-lived signed link to a trip's dashboard photo, for its participants only. */
export async function getTripPhotoUrl(id: string, viewer: Profile): Promise<string | null> {
  const trip = await getTrip(id, viewer)
  if (!trip) return null
  const { data, error } = await db()
    .storage.from(PHOTO_BUCKET)
    .createSignedUrl(trip.start_photo_path, PHOTO_URL_TTL)
  if (error) {
    console.error("[data] getTripPhotoUrl", error)
    return null
  }
  return data.signedUrl
}

/** Everything a home screen needs in one round trip. */
export async function getHomeState(profile: Profile): Promise<HomeState> {
  const [active, recent] = await Promise.all([getActiveTrips(profile), listTrips(profile)])
  return {
    me: toMe(profile),
    active: active.map((row) => toTrip(row, profile)),
    recent: recent.map((row) => toTrip(row, profile)),
    serverNow: Date.now(),
  }
}
