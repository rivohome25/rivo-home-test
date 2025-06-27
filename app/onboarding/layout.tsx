import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fix: Properly await cookies() before using it
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  console.log('Onboarding layout: Starting auth check')
  
  try {
    // Check if the user is authenticated (use getUser instead of getSession)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('Onboarding layout: No user found, redirecting to sign-in')
      return redirect('/sign-in')
    }
    
    console.log('Onboarding layout: User found:', user.id)
    
    // Get user profile to check role - handle RLS permission issues gracefully
    let profile = null
    let profileError = null
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      profile = data
      profileError = error
    } catch (err) {
      console.error('Onboarding layout: Profile query error:', err)
      profileError = err
    }
    
    if (profileError) {
      console.error('Onboarding layout: Error fetching profile:', profileError)
      
      // If RLS is blocking profile access, check user metadata for admin role
      if (profileError.code === '42501') {
        console.log('Onboarding layout: RLS blocking profile access, checking user metadata')
        
        const userRole = user.user_metadata?.role
        console.log('Onboarding layout: User metadata role:', userRole)
        
        if (userRole === 'admin') {
          console.log('Onboarding layout: Admin detected via metadata, redirecting to /admin')
          return redirect('/admin')
        }
        
        // If not admin and RLS is blocking, there's a configuration issue
        console.error('Onboarding layout: CRITICAL - RLS policies preventing profile access')
        console.error('Onboarding layout: User cannot complete onboarding flow')
        
        // For now, continue to onboarding page - maybe profile will be created
      }
      // Continue to onboarding if profile doesn't exist or other error
    } else if (profile) {
      console.log('Onboarding layout: User role:', profile.role)
      
      // Admin users should go directly to admin area
      if (profile.role === 'admin') {
        console.log('Onboarding layout: Admin detected, redirecting to /admin')
        return redirect('/admin')
      }
    }
    
    try {
      // Check if onboarding is already completed
      const { data: onboarding, error: onboardingError } = await supabase
        .from('user_onboarding')
        .select('completed')
        .eq('user_id', user.id)
        .single()
      
      if (onboardingError && onboardingError.code !== 'PGRST116') {
        console.error('Onboarding layout: Database error:', onboardingError)
      }
      
      if (onboarding?.completed) {
        console.log('Onboarding layout: Onboarding already completed, redirecting to dashboard')
        return redirect('/dashboard')
      }
      
      console.log('Onboarding layout: Onboarding not completed, showing onboarding page')
    } catch (dbErr) {
      console.error('Error in onboarding layout:', dbErr)
      // Continue to render the page even if there's an error checking onboarding status
    }
  } catch (authErr) {
    console.error('Authentication error in onboarding layout:', authErr)
    return redirect('/sign-in?error=auth_failure')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
} 