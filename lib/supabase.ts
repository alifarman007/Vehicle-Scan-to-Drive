import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"
import { getSupabaseEnv } from "./env"
import { AppError } from "./errors"

let cached: { id: string; client: SupabaseClient<Database> } | null = null

/**
 * Server-only Supabase client with the secret key. It bypasses RLS, so it must
 * never reach the browser. Every request skips Next's fetch cache.
 */
export function db(): SupabaseClient<Database> {
  const env = getSupabaseEnv()
  if (!env) throw new AppError("not_configured", 503)
  const id = `${env.url}|${env.key}`
  if (cached?.id === id) return cached.client

  const client = createClient<Database>(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  })
  cached = { id, client }
  return client
}
