import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { updateOnboardingProgress } from '@/lib/provider-onboarding-progress'

export async function POST(req: Request) {
  // 1) Bind Supabase to the incoming cookies
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // 2) Grab the logged in user
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  // 3) Parse the incoming payload
  const { full_name, business_name, phone, zip_code } = await req.json()

  // 4) Upsert into provider_profiles
  const { error: upsertErr } = await supabase
    .from('provider_profiles')
    .upsert(
      {
        user_id:        user.id,
        full_name,
        business_name,
        email:          user.email!,
        phone,
        zip_code,
      },
      { onConflict: 'user_id' }
    )

  if (upsertErr) {
    console.error('Basic info upsert failed:', upsertErr)
    return NextResponse.json(
      { error: upsertErr.message },
      { status: 400 }
    )
  }

  // 5) Update onboarding progress - Step 1 completed, move to Step 2
  try {
    await updateOnboardingProgress(user.id, 1, true)
    console.log('✅ Step 1 (basic-info) completed, progress updated')
  } catch (progressError) {
    console.error('⚠️ Failed to update onboarding progress:', progressError)
    // Don't fail the request if progress tracking fails
  }

  // 6) Return success
  return NextResponse.json({ 
    success: true,
    nextStep: '/provider-onboarding/services-offered'
  })
} 