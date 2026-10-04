/** Placeholder product name. Change it here and everywhere follows. */
export const APP_NAME = "RidePass"

/** All times are shown in this zone, no matter where the server or phone is. */
export const TIME_ZONE = "Asia/Dhaka"

/** How often screens poll for changes while they wait on the other phone. */
export const POLL_MS = 4000

export const RECENT_TRIPS_LIMIT = 10

/** httpOnly cookie that holds this device's profile id. */
export const SESSION_COOKIE = "rp_pid"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365

export const PHOTO_BUCKET = "dashboard-photos"
/** Signed photo links live this long (seconds). */
export const PHOTO_URL_TTL = 300
/** Server-side cap for an uploaded dashboard photo. Clients compress to ~500 KB. */
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024
