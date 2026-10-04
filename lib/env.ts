import "server-only"

export type SupabaseEnv = { url: string; key: string }

/** Reads server-only Supabase settings. Returns null when they're missing. */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.SUPABASE_URL?.trim()
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim()
  if (!url || !key) return null
  return { url, key }
}

export function isConfigured(): boolean {
  return getSupabaseEnv() !== null
}
