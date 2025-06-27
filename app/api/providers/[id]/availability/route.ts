import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const providerId = params.id
  
  // Initialize Supabase client
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
  
  // Fetch provider availability
  const { data, error } = await supabase
    .from('provider_availability')
    .select('id, day_of_week, start_time, end_time')
    .eq('provider_id', providerId)
    .order('day_of_week, start_time')
  
  if (error) {
    console.error('Error fetching provider availability:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data || [])
} 