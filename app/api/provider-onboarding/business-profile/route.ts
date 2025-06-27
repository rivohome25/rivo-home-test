// app/api/provider-onboarding/business-profile/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { updateOnboardingProgress } from '@/lib/provider-onboarding-progress'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // 1) Auth check
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2) Parse body
  const { bio, logo_url, portfolio, social_links } = await req.json()
  if (
    typeof bio !== 'string' ||
    typeof logo_url !== 'string' ||
    !Array.isArray(portfolio) ||
    !Array.isArray(social_links)
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // 3) Update existing provider_profiles row (don't use upsert to avoid overwriting basic info)
  const { error: updateErr } = await supabase
    .from('provider_profiles')
    .update({
      bio,
      logo_url,
      portfolio, // e.g. ['https://...','https://...']
      social_links // e.g. ['https://twitter.com/...']
    })
    .eq('user_id', user.id)

  if (updateErr) {
    console.error('Business profile update failed:', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // 4) Update onboarding progress - Step 4 completed, move to Step 5
  try {
    await updateOnboardingProgress(user.id, 4, true)
    console.log('✅ Step 4 (business-profile) completed, progress updated')
  } catch (progressError) {
    console.error('⚠️ Failed to update onboarding progress:', progressError)
    // Don't fail the request if progress tracking fails
  }

  // 5) Success
  return NextResponse.json({ 
    success: true,
    nextStep: '/provider-onboarding/external-reviews'
  })
} 