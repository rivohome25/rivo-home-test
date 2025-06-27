import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { updateOnboardingProgress } from '@/lib/provider-onboarding-progress'

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // 1) auth
  const {
    data: { user },
    error: uErr
  } = await supabase.auth.getUser()
  if (uErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2) update status → pending
  const { error: updErr } = await supabase
    .from('provider_profiles')
    .update({ onboarding_status: 'pending', updated_at: 'now()' })
    .eq('user_id', user.id)

  if (updErr) {
    console.error('Submit for review failed:', updErr)
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  // 3) Update onboarding progress - Step 8 completed (awaiting review)
  try {
    await updateOnboardingProgress(user.id, 8, true)
    console.log('✅ Step 8 (submit-for-review) completed, progress updated')
  } catch (progressError) {
    console.error('⚠️ Failed to update onboarding progress:', progressError)
    // Don't fail the request if progress tracking fails
  }

  return NextResponse.json({ 
    success: true,
    nextStep: '/provider-onboarding/awaiting-review'
  })
} 