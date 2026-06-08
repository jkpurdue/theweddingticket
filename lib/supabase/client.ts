import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export const isSupabaseConfigured = !!supabase;

// Usage note:
// The current MVP runs fully on localStorage via data-service.ts for instant demo.
// To switch to real Supabase:
// 1. Add your credentials to .env.local (copy .env.example)
// 2. Run the SQL schema from /supabase/schema.sql in your Supabase SQL editor
// 3. Replace calls in data-service (or create a new supabase-service.ts) to use this client
// 4. Implement proper RLS policies for weddings/guests/rsvps
