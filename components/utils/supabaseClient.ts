'use client'

import { supabase } from '@/lib/supabaseClient'

export { supabase }

// Re-export auth for easy access
export const auth = {
  user: () => supabase.auth.getUser().then(({data}) => data.user)
} 