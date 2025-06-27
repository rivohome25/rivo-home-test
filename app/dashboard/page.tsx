import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

// Import providers widgets
import JobCounts       from '@/components/JobCounts';
import EarningsSummary from '@/components/EarningsSummary';
import ActiveJobs      from '@/components/ActiveJobs';
import UpcomingJobs    from '@/components/UpcomingJobs';
import RecentReviews   from '@/components/RecentReviews';
import JobHistory      from '@/components/JobHistory';
import AllJobs         from '@/components/AllJobs';
import NextPayouts     from '@/components/NextPayouts';

// Homeowner widgets
import RecentActivity from '@/components/widgets/homeowner/RecentActivity'
import MaintenanceSchedule from '@/components/widgets/homeowner/MaintenanceSchedule'
import MyReviews from '@/components/widgets/homeowner/MyReviews'
import UpcomingTasks from '@/components/UpcomingTasks'
import Notifications from '@/components/Notifications'

// Navigation components
import HomeownerNavigation from '@/components/HomeownerNavigation'
import ProviderNavigation from '@/components/ProviderNavigation'
import HomeownerDashboardClient from '@/components/HomeownerDashboardClient'

// Auth components
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  console.log('Dashboard: Starting dashboard page load')
  
  // Fix: Properly await searchParams
  const params = await searchParams
  const fromAdmin = params?.from === 'admin'
  if (fromAdmin) {
    console.log('Dashboard: Detected redirect from admin - preventing loop')
  }
  
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  // The layout already checks for session, but we still need to get the user
  const { data: { user } } = await supabase.auth.getUser()
  
  // User should always exist because of the layout check, but add a failsafe
  if (!user) {
    console.log('Dashboard: No user found, redirecting to sign-in')
    return redirect('/sign-in')
  }

  console.log('Dashboard: User found:', user.id)

  // Try to get profile - if RLS is blocking, handle gracefully
  let profile = null
  let profileError = null
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    profile = data
    profileError = error
    
    console.log('Dashboard: Profile query result:', { profile, error: profileError })
  } catch (err) {
    console.error('Dashboard: Unexpected profile query error:', err)
    profileError = err
  }
  
  // If profile query failed due to permissions, try to determine admin status from user metadata
  if (!profile && profileError?.code === '42501') {
    console.log('Dashboard: Profile query blocked by RLS, checking user metadata for admin role')
    
    const userRole = user.user_metadata?.role
    console.log('Dashboard: User metadata role:', userRole)
    
    if (userRole === 'admin' && !fromAdmin) {
      console.log('Dashboard: User has admin role in metadata, redirecting to /admin')
      redirect('/admin')
    }
    
    // If not admin or already came from admin, show error
    if (fromAdmin) {
      console.error('Dashboard: CRITICAL - Admin user cannot access profile due to RLS policies')
      console.error('Dashboard: This indicates a database permission configuration issue')
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-xl font-bold text-red-600 mb-4">Database Permission Error</h1>
            <p className="text-gray-700 mb-4">
              Unable to access user profile due to database permission restrictions. 
              This is likely an RLS (Row Level Security) policy configuration issue.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Error: {profileError?.message || 'Unknown database error'}
            </p>
            <div className="flex gap-2">
              <SignOutButton variant="button" showIcon={false} />
              <a href="/sign-in" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Try Sign In Again
              </a>
                    </div>
      </div>
    </div>
  )
}
    
    console.log('Dashboard: No profile accessible and not admin, redirecting to sign-in')
    return redirect('/sign-in?error=profile_access_denied')
  }
  
  if (!profile) {
    console.log('Dashboard: No profile found, redirecting to onboarding')
    redirect('/onboarding')
  }

  console.log('Dashboard: User role:', profile.role)

  // Redirect admin users to dedicated admin area (but prevent loops)
  if (profile.role === 'admin' && !fromAdmin) {
    console.log('Dashboard: Admin user detected, redirecting to /admin')
    redirect('/admin')
  }

  // If we're here and it's an admin with fromAdmin=true, something is wrong
  if (profile.role === 'admin' && fromAdmin) {
    console.error('Dashboard: REDIRECT LOOP DETECTED - Admin user redirected from /admin back to /dashboard')
    console.error('Dashboard: This indicates an issue with admin role verification')
    console.error('Dashboard: Falling back to basic dashboard for admin user')
  }

  // Check if homeowner has completed onboarding
  if (profile.role === 'homeowner') {
    const { data: onboarding, error: onboardingError } = await supabase
      .from('user_onboarding')
      .select('completed')
      .eq('user_id', user.id)
      .single()
    
    console.log('Dashboard: Homeowner onboarding check:', { onboarding, error: onboardingError })
    
    // If no onboarding record exists OR onboarding is not completed, redirect to onboarding
    if (onboardingError?.code === 'PGRST116' || !onboarding?.completed) {
      console.log('Dashboard: Homeowner onboarding not complete, redirecting to onboarding')
      return redirect('/onboarding')
    }
  }

  console.log('Dashboard: All checks passed, rendering dashboard for role:', profile.role)

  // Provider dashboard with enhanced wide layout
  if (profile.role === 'provider') {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProviderNavigation 
          title="Service Provider Dashboard" 
          currentPage="dashboard"
        />
        
        {/* Enhanced wide layout with minimal side margins */}
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="rivo-card p-6 transition-all duration-300 hover:shadow-lg">
              <JobCounts />
            </div>
            <div className="rivo-card p-6 transition-all duration-300 hover:shadow-lg">
              <ActiveJobs />
            </div>
            <div className="rivo-card p-6 transition-all duration-300 hover:shadow-lg">
              <UpcomingJobs />
            </div>
            <div className="rivo-card p-6 transition-all duration-300 hover:shadow-lg">
              <RecentReviews />
            </div>
          </div>
          <div className="rivo-card p-6 transition-all duration-300 hover:shadow-lg">
            <EarningsSummary providerId={user.id} />
          </div>
          <div className="rivo-card p-6 transition-all duration-300 hover:shadow-lg">
            <JobHistory providerId={user.id} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="rivo-card p-6 transition-all duration-300 hover:shadow-lg">
              <NextPayouts />
            </div>
            <div className="rivo-card p-6 transition-all duration-300 hover:shadow-lg">
              <AllJobs />
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Homeowner dashboard with enhanced ultra-wide layout
  if (profile.role === 'homeowner') {
    return (
      <HomeownerDashboardClient>
        <div className="min-h-screen bg-gray-50">
          <HomeownerNavigation 
            title="Homeowner Dashboard" 
            currentPage="dashboard"
          />
          
          {/* Ultra-wide layout with minimal side margins for maximum space utilization */}
          <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-8 space-y-6">
            {/* Enhanced Grid Layout - Maximum horizontal space utilization */}
            <div className="space-y-6">
              {/* Row 1: Upcoming Tasks (larger) | Notifications (smaller) - Enhanced proportions */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6">
                <div className="xl:col-span-3 rivo-card p-6 transition-all duration-300 hover:shadow-lg">
                  <UpcomingTasks />
                </div>
                <div className="xl:col-span-2 rivo-card p-6 transition-all duration-300 hover:shadow-lg">
                  <Notifications />
                </div>
              </div>
              
              {/* Row 2: Recent Activity | Maintenance Schedule (equal width) - Enhanced spacing */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="rivo-card p-6 transition-all duration-300 hover:shadow-lg">
                  <RecentActivity />
                </div>
                <div className="rivo-card p-6 transition-all duration-300 hover:shadow-lg">
                  <MaintenanceSchedule />
                </div>
              </div>
              
              {/* Row 3: My Reviews (full width) - Enhanced spacing */}
              <div className="rivo-card p-6 transition-all duration-300 hover:shadow-lg">
                <MyReviews />
              </div>
            </div>
          </div>
        </div>
      </HomeownerDashboardClient>
    )
  }
  
  // Fallback for unknown roles with enhanced wide layout
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="enterprise-header relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto relative z-10 px-2 sm:px-4 lg:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <SignOutButton variant="icon" showIcon={true} />
              </div>
              <div>
                <h1 className="text-display text-white font-bold tracking-tight">Welcome</h1>
                <p className="text-white/90 text-lg font-medium">Welcome back, {profile.full_name || user.email}</p>
              </div>
            </div>
            <div className="ml-2">
              <SignOutButton variant="button" showIcon={true} />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-8">
        <div className="rivo-card p-6">
          <p className="text-rivo-dark font-medium">Role: {profile.role} | Tier: {profile.tier}</p>
          <p className="mt-4">Please contact support to set up your dashboard.</p>
          <a 
            href="/contact" 
            className="rivo-button inline-block mt-4"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
} 