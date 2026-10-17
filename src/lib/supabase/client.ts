import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes("example.supabase.co") &&
  supabaseAnonKey &&
  supabaseAnonKey !== "anon_key_placeholder"
);

// Client-side Supabase client (using anon key)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side Admin client (bypasses RLS for secure server actions & API routes)
export const supabaseAdmin = (isSupabaseConfigured && supabaseServiceRoleKey && supabaseServiceRoleKey !== "service_role_key_placeholder")
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
