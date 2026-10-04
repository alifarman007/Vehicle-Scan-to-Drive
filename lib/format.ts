import { TIME_ZONE } from "./config"
import { strings } from "./strings"

/*
 * Every formatter pins `timeZone`, so the server (UTC on Vercel) and the phone
 * render identical text and hydration never mismatches. Node and browsers
 * disagree on the space before AM/PM (U+202F vs U+0020), so we normalise it.
 */
// U+202F (narrow no-break space) and U+00A0 (no-break space)
const ODD_SPACES = new RegExp(`[${String.fromCharCode(0x202f, 0xa0)}]`, "g")
const clean = (s: string) => s.replace(ODD_SPACES, " ")

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
})
const timeSecFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
})
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
})
const dateYearFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
})
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

type DateInput = string | number | Date

const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d))

/** "10:42 AM" */
export function formatTime(d: DateInput): string {
  return clean(timeFmt.format(toDate(d)))
}

/** "10:42:05 AM" */
export function formatTimeWithSeconds(d: DateInput): string {
  return clean(timeSecFmt.format(toDate(d)))
}

/** "10:42 – 11:05 AM", or "11:42 AM – 12:05 PM" when the period changes. */
export function formatTimeRange(start: DateInput, end: DateInput): string {
  const a = formatTime(start)
  const b = formatTime(end)
  const period = a.slice(-3)
  return period === b.slice(-3) && / [AP]M$/.test(period) ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`
}

/** "Sat 4 Oct" */
export function formatDate(d: DateInput): string {
  return clean(dateFmt.format(toDate(d)))
}

/** "4 Oct 2026" */
export function formatDateLong(d: DateInput): string {
  return clean(dateYearFmt.format(toDate(d)))
}

/** "2026-10-04" in Dhaka time, for same-day comparisons. */
export function dayKey(d: DateInput): string {
  return dayKeyFmt.format(toDate(d))
}

/** "Today", "Yesterday" or "Sat 4 Oct", relative to `now` (pass server time). */
export function formatDay(
  d: DateInput,
  now: number,
  labels: { today: string; yesterday: string }
): string {
  const key = dayKey(d)
  if (key === dayKey(now)) return labels.today
  if (key === dayKey(now - 86_400_000)) return labels.yesterday
  return formatDate(d)
}

/** Live trip timer: "00:12:05". Hours keep growing past 99 if they must. */
export function formatTimer(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":")
}

/** Human duration: "45 sec", "12 min", "1 h 05 min". */
export function formatDuration(ms: number): string {
  const d = strings.duration
  const total = Math.max(0, Math.round(ms / 1000))
  if (total < 60) return d.seconds(total)
  const minutes = Math.round(total / 60)
  if (minutes < 60) return d.minutes(minutes)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? d.hours(h) : d.hoursMinutes(h, String(m).padStart(2, "0"))
}

/*
 * Many Bangladeshi names start with an honorific ("Md. Rahim Uddin",
 * "Mst. Nusrat Jahan"). Skip those when greeting someone or picking initials,
 * as long as a real name follows.
 */
const HONORIFIC = /^(md|mohd|mohammad|mohammed|muhammad|mst|most|mosammat|mosammad|sk|sheikh|shaikh|dr|engr|prof|mr|mrs|ms)\.?$/i

function nameParts(name: string): string[] {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  let start = 0
  while (start < parts.length - 1 && HONORIFIC.test(parts[start])) start++
  return parts.slice(start)
}

export function initials(name: string): string {
  const parts = nameParts(name)
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2)
  return letters.toUpperCase()
}

export function firstName(name: string): string {
  return nameParts(name)[0] ?? name.trim()
}
