import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { Toaster } from '@/components/ui/toaster'
import SignOutButton from '@/components/SignOutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('Admin layout: Starting admin verification')
  
  // Check if the user is authenticated and has admin privileges
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  // Use getUser() instead of getSession() for security
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.log('Admin layout: No user found, redirecting to sign-in')
    redirect('/sign-in')
  }
  
  console.log('Admin layout: User found:', user.id)
  
  // Try to get profile - should work now with fixed RLS
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()
  
  console.log('Admin layout: Profile query result:', { profile, error })
  
  if (error) {
    console.error('Admin layout: Error fetching profile:', error)
    
    // If still getting permission errors, show detailed error
    if (error.code === '42501') {
      console.error('Admin layout: CRITICAL - Still getting permission denied after RLS fix')
      console.error('Admin layout: This indicates a deeper database configuration issue')
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-xl font-bold text-red-600 mb-4">Admin Access Error</h1>
            <p className="text-gray-700 mb-4">
              Unable to verify admin privileges due to database configuration issues.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Error Code: {error.code} - {error.message}
            </p>
            <div className="flex gap-2">
              <SignOutButton variant="button" showIcon={false} />
              <a href="/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      )
    }
    
    console.log('Admin layout: Redirecting to dashboard due to profile error')
    redirect('/dashboard?from=admin')
  }
  
  if (!profile) {
    console.error('Admin layout: No profile found for user')
    console.log('Admin layout: Redirecting to dashboard - no profile')
    redirect('/dashboard?from=admin')
  }
  
  if (profile.role !== 'admin') {
    console.log(`Admin layout: User role is '${profile.role}', not 'admin'`)
    console.log('Admin layout: Redirecting to dashboard - insufficient privileges')
    redirect('/dashboard?from=admin')
  }
  
  console.log(`Admin layout: Admin verification successful for ${profile.full_name || user.email}`)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <a href="/admin" className="text-xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
              RivoHome Admin
            </a>
            <nav className="flex space-x-4 items-center">
              <a href="/admin/users" className="text-gray-600 hover:text-gray-800 transition-colors">Users</a>
              <a href="/admin/providers" className="text-gray-600 hover:text-gray-800 transition-colors">Providers</a>
              <a href="/admin/reviews" className="text-gray-600 hover:text-gray-800 transition-colors">Reviews</a>
              <a href="/admin/analytics" className="text-gray-600 hover:text-gray-800 transition-colors">Analytics</a>
              <SignOutButton variant="link" showIcon={true} />
            </nav>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
      <Toaster />
    </div>
  )
} 