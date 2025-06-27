import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Define initial services to seed
const INITIAL_SERVICES = [
  { name: 'Plumbing' },
  { name: 'Electrical' },
  { name: 'HVAC' },
  { name: 'Landscaping' },
  { name: 'House Cleaning' },
  { name: 'Painting' },
  { name: 'Carpentry' },
  { name: 'Roofing' },
  { name: 'Pest Control' },
  { name: 'Flooring' },
  { name: 'Appliance Repair' },
  { name: 'General Contracting' },
  { name: 'Handyman Services' },
  { name: 'Window Installation/Repair' },
  { name: 'Security System Installation' },
  { name: 'Pool Maintenance' },
  { name: 'Garage Door Repair' },
  { name: 'Driveway/Patio Installation' },
  { name: 'Fence Installation/Repair' },
  { name: 'Gutter Cleaning/Repair' },
  // Add the ones the user requested
  { name: 'Plumbing Repair' },
  { name: 'HVAC Maintenance' },
  { name: 'Electrical Work' },
  { name: 'Appliance Installation' },
  { name: 'General Handyman' }
]

export async function GET(req: Request) {
  // This can be restricted to admins in a real app
  // For now, we'll allow any authenticated user to seed services
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Check authentication
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

  try {
    // Check if we already have services
    const { count, error: countErr } = await supabase
      .from('provider_services_master')
      .select('*', { count: 'exact', head: true })
    
    if (countErr) throw countErr
    
    // If we already have services, don't seed again
    if (count && count > 0) {
      return NextResponse.json({ 
        message: `${count} services already exist, skipping seed` 
      })
    }
    
    // Insert initial services
    const { error: insertErr } = await supabase
      .from('provider_services_master')
      .insert(INITIAL_SERVICES)
    
    if (insertErr) throw insertErr
    
    return NextResponse.json({ 
      success: true, 
      message: `Seeded ${INITIAL_SERVICES.length} services` 
    })
  } catch (error: any) {
    console.error('Seeding services failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed services' },
      { status: 500 }
    )
  }
} 