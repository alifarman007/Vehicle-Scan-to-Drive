import { syncServerClock } from "./clock"
import { isErrorCode, type ErrorCode } from "./errors"
import { strings } from "./strings"

/** Client-side error with a code that maps to friendly text. */
export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number
  ) {
    super(code)
    this.name = "ApiError"
  }
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(input, { cache: "no-store", credentials: "same-origin", ...init })
  } catch {
    throw new ApiError("network", 0)
  }
  const serverNow = res.headers.get("x-server-now")
  if (serverNow) syncServerClock(Number(serverNow), Date.now())
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // Non-JSON body (e.g. a proxy error page); handled below.
  }
  if (!res.ok) {
    const code = (body as { error?: { code?: unknown } } | null)?.error?.code
    throw new ApiError(isErrorCode(code) ? code : res.status >= 500 ? "server_error" : "invalid_input", res.status)
  }
  return body as T
}

export function postJson<T>(url: string, data: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}

export const fetcher = <T>(url: string) => apiFetch<T>(url)

export function errorCode(err: unknown): ErrorCode {
  return err instanceof ApiError ? err.code : "server_error"
}

export function errorMessage(err: unknown): string {
  return strings.errors[errorCode(err)]
}
