import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Reset Provider Onboarding API endpoint
 * This endpoint resets a provider's onboarding progress so they can go through it again
 */
export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Get the logged-in user
  const { data: { user }, error: userErr } = await supabase.auth.getUser()

  if (userErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    console.log('🔄 Resetting provider onboarding for user:', user.id)

    // Reset provider onboarding progress
    const { error: onboardingErr } = await supabase
      .from('provider_onboarding')
      .upsert({
        user_id: user.id,
        current_step: 1,
        completed: false,
        steps_completed: {},
        updated_at: new Date().toISOString()
      })

    if (onboardingErr) {
      console.error('Failed to reset onboarding progress:', onboardingErr)
      return NextResponse.json({ error: 'Failed to reset onboarding progress' }, { status: 500 })
    }

    // Reset provider profile status
    const { error: profileErr } = await supabase
      .from('provider_profiles')
      .update({ 
        onboarding_status: 'incomplete',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (profileErr && profileErr.code !== 'PGRST116') { // PGRST116 = no rows found, which is fine
      console.error('Failed to reset provider profile status:', profileErr)
      // Don't fail the request for this, as the main onboarding reset worked
    }

    // Optional: Clear provider applications if they exist
    const { error: applicationErr } = await supabase
      .from('provider_applications')
      .delete()
      .eq('user_id', user.id)

    if (applicationErr && applicationErr.code !== 'PGRST116') {
      console.error('Failed to clear provider applications:', applicationErr)
      // Don't fail the request for this
    }

    console.log('✅ Provider onboarding reset successfully')

    return NextResponse.json({ 
      success: true,
      message: 'Provider onboarding has been reset. You can now start over.',
      nextStep: '/provider-onboarding'
    })

  } catch (error) {
    console.error('❌ Exception in reset operation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
} 