import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Placeholder values when env vars are missing (local dev without .env.local).
// Prevents the app from crashing at module load; calls will simply fail silently.
const placeholderUrl = 'https://placeholder.supabase.co'
const placeholderKey = 'placeholder-key'

export const supabase = createClient(
  supabaseUrl || placeholderUrl,
  supabaseKey || placeholderKey
)

export const supabaseReady = Boolean(supabaseUrl && supabaseKey)
