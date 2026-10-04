/** Server clock in ms. A function so render code stays free of direct Date.now() calls. */
export function serverTime(): number {
  return Date.now()
}
