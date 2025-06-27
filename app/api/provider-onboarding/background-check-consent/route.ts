import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { updateOnboardingProgress } from '@/lib/provider-onboarding-progress'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // 1) Ensure logged in
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2) Parse payload
  const { consent } = await req.json()
  if (typeof consent !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // 3) Upsert consent flag
  const { error: upsertErr } = await supabase
    .from('provider_profiles')
    .update({ background_check_consent: consent, updated_at: 'now()' })
    .eq('user_id', user.id)

  if (upsertErr) {
    console.error('Background consent upsert failed:', upsertErr)
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  // 4) Update onboarding progress - Step 6 completed, move to Step 7
  try {
    await updateOnboardingProgress(user.id, 6, true)
    console.log('✅ Step 6 (background-check-consent) completed, progress updated')
  } catch (progressError) {
    console.error('⚠️ Failed to update onboarding progress:', progressError)
    // Don't fail the request if progress tracking fails
  }

  return NextResponse.json({ 
    success: true,
    nextStep: '/provider-onboarding/agreements'
  })
} 