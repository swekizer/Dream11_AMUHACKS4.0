import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cache } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create a single cached instance
const createSupabaseClient = cache(() => {
  if (typeof window === 'undefined') {
    // Server-side
    return createClient(supabaseUrl, supabaseAnonKey)
  } else {
    // Client-side
    return createClientComponentClient()
  }
})

// Export the client instance
export const supabase = createSupabaseClient()