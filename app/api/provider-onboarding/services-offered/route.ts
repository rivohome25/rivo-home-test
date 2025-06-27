import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { updateOnboardingProgress } from '@/lib/provider-onboarding-progress'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // 1) Get current user
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2) Parse payload
  const { service_type_ids, radius_miles, other_services } = await req.json()
  if (!Array.isArray(service_type_ids) || typeof radius_miles !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  let allServiceIds = [...service_type_ids]

  // 3) Handle custom services - add them to the master table if they don't exist
  if (other_services && Array.isArray(other_services) && other_services.length > 0) {
    try {
      for (const serviceName of other_services) {
        const trimmedName = serviceName.trim()
        if (!trimmedName) continue

        // Check if service already exists
        const { data: existingService, error: checkError } = await supabase
          .from('provider_services_master')
          .select('id')
          .eq('name', trimmedName)
          .single()

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error checking existing service:', checkError)
          continue
        }

        let serviceId
        if (existingService) {
          serviceId = existingService.id
        } else {
          // Add new service to master table
          const { data: newService, error: insertError } = await supabase
            .from('provider_services_master')
            .insert({ name: trimmedName })
            .select('id')
            .single()

          if (insertError) {
            console.error('Error adding new service:', insertError)
            continue
          }
          serviceId = newService.id
        }

        allServiceIds.push(serviceId)
      }
    } catch (error) {
      console.error('Error processing custom services:', error)
      return NextResponse.json({ error: 'Failed to process custom services' }, { status: 500 })
    }
  }

  // 4) Upsert each selection (both predefined and custom services)
  if (allServiceIds.length === 0) {
    return NextResponse.json({ error: 'No services selected' }, { status: 400 })
  }

  const upserts = allServiceIds.map((stype: number) =>
    supabase
      .from('provider_services')
      .upsert({
        provider_id: user.id,
        service_id: stype, // Note: Using service_id, not service_type_id to match existing schema
        radius_miles
      }, { onConflict: 'provider_id,service_id' })
  )
  const results = await Promise.all(upserts)
  const errs = results.filter(r => r.error).map(r => r.error!.message)
  if (errs.length) {
    console.error('Services upsert errors:', errs)
    return NextResponse.json({ error: errs.join('; ') }, { status: 500 })
  }

  // 5) Update onboarding progress - Step 2 completed, move to Step 3
  try {
    await updateOnboardingProgress(user.id, 2, true)
    console.log('✅ Step 2 (services-offered) completed, progress updated')
  } catch (progressError) {
    console.error('⚠️ Failed to update onboarding progress:', progressError)
    // Don't fail the request if progress tracking fails
  }

  return NextResponse.json({ 
    success: true,
    nextStep: '/provider-onboarding/documents-upload',
    servicesAdded: allServiceIds.length
  })
} 