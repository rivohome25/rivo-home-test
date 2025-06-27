import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Fetch all service types
    const { data, error } = await supabase
      .from('provider_services_master')
      .select('id, name')
      .order('name')
    
    if (error) {
      console.error('Error fetching service types:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching service types:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 