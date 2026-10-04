import "server-only"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

import { SESSION_COOKIE, SESSION_MAX_AGE } from "./config"
import { getProfileById, isUuid, type Profile } from "./data"
import { AppError } from "./errors"
import { homeFor } from "./routes"
import type { Role } from "./types"

/*
 * Prototype identity: an httpOnly cookie holding the profile id, set after
 * onboarding and valid for a year. No login yet. Not localStorage, because
 * iPhone Safari can wipe it.
 */

/** The profile using this device, or null. Cached for the current request. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const id = (await cookies()).get(SESSION_COOKIE)?.value
  if (!id || !isUuid(id)) return null
  return getProfileById(id)
})

/** For route handlers: throws a friendly API error when not allowed. */
export async function requireProfile(role?: Role): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) throw new AppError("not_registered", 401)
  if (role && profile.role !== role) throw new AppError("wrong_role", 403)
  return profile
}

/** For pages: sends the visitor to onboarding or to their own home. */
export async function requirePageProfile(role?: Role): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/welcome")
  if (role && profile.role !== role) redirect(homeFor(profile.role))
  return profile
}

export async function setSession(profileId: string): Promise<void> {
  ;(await cookies()).set(SESSION_COOKIE, profileId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    priority: "high",
  })
}

export async function clearSession(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE)
}
