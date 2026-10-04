import "server-only"

import { NextResponse } from "next/server"

import { AppError } from "./errors"

/** Never cached, and stamped with server time so clients can align their clocks. */
export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store, max-age=0", "X-Server-Now": String(Date.now()), ...init?.headers },
  })
}

function errorJson(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return json({ error: { code: err.code } }, { status: err.status })
  }
  console.error("[api] unexpected error", err)
  return json({ error: { code: "server_error" } }, { status: 500 })
}

/** Rejects writes coming from another site (cookies are SameSite=Lax too). */
function assertSameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return
  const origin = req.headers.get("origin")
  if (!origin) return
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  try {
    if (new URL(origin).host !== host) throw new AppError("wrong_role", 403)
  } catch (err) {
    if (err instanceof AppError) throw err
    throw new AppError("invalid_input", 400)
  }
}

/**
 * Wraps a route handler: same-origin check for writes, JSON responses that are
 * never cached, and AppErrors turned into `{ error: { code } }`.
 */
export async function handle(req: Request, fn: () => Promise<unknown>): Promise<Response> {
  try {
    assertSameOrigin(req)
    const result = await fn()
    return result instanceof Response ? result : json(result)
  } catch (err) {
    return errorJson(err)
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json()
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  } catch {
    throw new AppError("invalid_input")
  }
}
