import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { updateOnboardingProgress } from '@/lib/provider-onboarding-progress'

const REQUIRED_AGREEMENTS = [
  'Provider Agreement',
  'Code of Conduct',
  'Non-Discrimination Policy'
] as const

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

  // 2) Parse payload
  const { agreed } = await req.json()
  if (
    !Array.isArray(agreed) ||
    !REQUIRED_AGREEMENTS.every(a => agreed.includes(a))
  ) {
    return NextResponse.json(
      { error: 'You must agree to all required documents' },
      { status: 400 }
    )
  }

  // 3) Build upsert entries
  const now = new Date().toISOString()
  const entries = REQUIRED_AGREEMENTS.map(name => ({
    provider_id:    user.id,
    agreement_name: name,
    agreed:         true,
    agreed_at:      now
  }))

  // 4) Upsert all at once
  const { error: upsertErr } = await supabase
    .from('provider_agreements')
    .upsert(entries, { onConflict: ['provider_id','agreement_name'] })

  if (upsertErr) {
    console.error('Agreements upsert failed:', upsertErr)
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  // 5) Update onboarding progress - Step 7 completed, this completes onboarding!
  try {
    await updateOnboardingProgress(user.id, 7, true)
    console.log('✅ Step 7 (agreements) completed - ONBOARDING FINISHED!')
  } catch (progressError) {
    console.error('⚠️ Failed to update onboarding progress:', progressError)
    // Don't fail the request if progress tracking fails
  }

  // 6) Success → onboarding complete, redirect to pending
  return NextResponse.json({ 
    success: true,
    nextStep: '/provider-onboarding/pending',
    message: 'Onboarding completed successfully!'
  })
} 