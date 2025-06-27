import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Helper function to check if a user is an admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error || !data) {
      console.error('Error checking admin status:', error)
      return false
    }
    
    return data.role === 'admin'
  } catch (err) {
    console.error('Exception in isUserAdmin:', err)
    return false
  }
}

// Helper function to get user from cookie and verify admin status
export async function getAdminUser(req: Request) {
  try {
    // Create a server client to get the session from cookies
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })
    
    // Get session from cookie
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return { user: null, error: 'No session found' }
    }
    
    // Check if user is admin
    const isAdmin = await isUserAdmin(session.user.id)
    
    if (!isAdmin) {
      return { user: null, error: 'User is not an admin' }
    }
    
    return { user: session.user, error: null }
  } catch (err) {
    console.error('Error in getAdminUser:', err)
    return { user: null, error: 'Authentication error' }
  }
} 