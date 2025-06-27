import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { 
  getOnboardingProgress, 
  getNextStepUrl, 
  initializeOnboardingProgress 
} from '@/lib/provider-onboarding-progress'

export default async function ProviderOnboarding() {
  const supabase = createServerComponentClient({ cookies })
  
  console.log('🚀 Starting provider onboarding check...')
  
  // Get the current user
  let user, userError
  try {
    const result = await supabase.auth.getUser()
    user = result.data?.user
    userError = result.error
    console.log('🔐 Auth check result:', { 
      hasUser: !!user, 
      userId: user?.id,
      userEmail: user?.email,
      error: userError?.message 
    })
  } catch (error) {
    console.error('❌ Auth check failed:', error)
    throw error
  }

  if (userError || !user) {
    console.log('🚪 No valid user, redirecting to sign-in')
    redirect('/sign-in')
  }

  try {
    console.log('📊 Checking onboarding progress for user:', user.id)
    
    // 1) Fetch their onboarding progress
    const progress = await getOnboardingProgress(user.id)
    console.log('📈 Current progress:', progress)

    // 2a) If there's _no_ row at all, kick them into step 1
    if (!progress) {
      console.log('🆕 No progress found, starting with step 1')
      redirect('/provider-onboarding/basic-info')
    }

    // 2b) If they have a row but `completed = true`, show the "pending" page
    if (progress.completed) {
      console.log('✅ Onboarding completed, showing pending page')
      redirect('/provider-onboarding/pending')
    }

    // 2c) Otherwise, send them to whatever step they left on
    const nextStepUrl = getNextStepUrl(progress)
    console.log('➡️ Redirecting to current step:', nextStepUrl)
    
    redirect(nextStepUrl)
    
  } catch (error) {
    console.error('💥 Unexpected error in provider onboarding check:', error)
    console.log('🔄 Fallback redirect to basic-info')
    redirect('/provider-onboarding/basic-info')
  }

  // This shouldn't be reached due to redirects above, but just in case
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Checking your provider status...</p>
      </div>
    </div>
  )
} 