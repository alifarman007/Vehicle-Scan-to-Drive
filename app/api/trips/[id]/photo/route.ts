import { NextResponse } from "next/server"

import { PHOTO_URL_TTL } from "@/lib/config"
import { getTripPhotoUrl } from "@/lib/data"
import { AppError } from "@/lib/errors"
import { getCurrentProfile } from "@/lib/session"

export const dynamic = "force-dynamic"

/**
 * Stable image URL for a trip's dashboard photo. Checks that the viewer is on
 * the trip, then redirects to a short-lived signed link. Because this URL
 * never changes, polling doesn't re-download the image.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await getCurrentProfile()
    if (!viewer) return new NextResponse(null, { status: 401 })
    const { id } = await ctx.params
    const signedUrl = await getTripPhotoUrl(id, viewer)
    if (!signedUrl) return new NextResponse(null, { status: 404 })
    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: { "Cache-Control": `private, max-age=${PHOTO_URL_TTL - 60}` },
    })
  } catch (err) {
    if (!(err instanceof AppError)) console.error("[api] photo", err)
    return new NextResponse(null, { status: err instanceof AppError ? err.status : 500 })
  }
}
