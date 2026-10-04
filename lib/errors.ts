/**
 * Error codes shared by server and client. The server only ever sends a code;
 * the UI turns it into friendly text from `strings.errors`.
 */
export const ERROR_CODES = [
  "network",
  "server_error",
  "not_configured",
  "not_registered",
  "already_registered",
  "wrong_role",
  "invalid_input",
  "name_required",
  "vehicle_required",
  "code_invalid",
  "code_not_found",
  "expected_passenger_code",
  "expected_driver_code",
  "own_code",
  "passenger_busy",
  "photo_required",
  "photo_too_large",
  "upload_failed",
  "no_active_trip",
  "wrong_driver",
  "trip_not_found",
  "trip_not_completed",
  "already_reviewed",
  "rating_required",
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value)
}

/** Thrown by server code; route handlers turn it into `{ error: { code } }`. */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number = 400
  ) {
    super(code)
    this.name = "AppError"
  }
}
