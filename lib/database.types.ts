// Generated from the live schema (Supabase MCP `generate_typescript_types`).
// Regenerate after changing supabase/schema.sql.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          code: string
          created_at: string
          id: string
          id_number: string | null
          name: string
          phone: string | null
          role: string
          vehicle_no: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          id_number?: string | null
          name: string
          phone?: string | null
          role: string
          vehicle_no?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          id_number?: string | null
          name?: string
          phone?: string | null
          role?: string
          vehicle_no?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          driver_id: string
          ended_at: string | null
          id: string
          passenger_id: string
          rating: number | null
          review_comment: string | null
          review_tags: string[]
          reviewed_at: string | null
          start_photo_path: string
          started_at: string
          status: string
          trip_no: number
          vehicle_no: string | null
        }
        Insert: {
          driver_id: string
          ended_at?: string | null
          id?: string
          passenger_id: string
          rating?: number | null
          review_comment?: string | null
          review_tags?: string[]
          reviewed_at?: string | null
          start_photo_path: string
          started_at?: string
          status?: string
          trip_no?: never
          vehicle_no?: string | null
        }
        Update: {
          driver_id?: string
          ended_at?: string | null
          id?: string
          passenger_id?: string
          rating?: number | null
          review_comment?: string | null
          review_tags?: string[]
          reviewed_at?: string | null
          start_photo_path?: string
          started_at?: string
          status?: string
          trip_no?: never
          vehicle_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
