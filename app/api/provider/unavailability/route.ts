import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/provider/unavailability - Fetch provider's unavailability blocks
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch provider's future unavailability blocks
    const { data: unavailability, error } = await supabase
      .from('provider_unavailability')
      .select('*')
      .eq('provider_id', user.id)
      .gte('end_ts', new Date().toISOString()) // Only future/current blocks
      .order('start_ts');

    if (error) {
      console.error('Error fetching unavailability:', error);
      return NextResponse.json({ error: 'Failed to fetch unavailability' }, { status: 500 });
    }

    return NextResponse.json({ unavailability });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/provider/unavailability - Create new unavailability blocks
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { unavailability } = await req.json();

    // Validate input
    if (!Array.isArray(unavailability)) {
      return NextResponse.json({ error: 'Unavailability must be an array' }, { status: 400 });
    }

    // Validate each unavailability entry
    for (const entry of unavailability) {
      if (!entry.start_ts || !entry.end_ts) {
        return NextResponse.json({ error: 'start_ts and end_ts are required' }, { status: 400 });
      }
      
      const startDate = new Date(entry.start_ts);
      const endDate = new Date(entry.end_ts);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      
      if (startDate >= endDate) {
        return NextResponse.json({ error: 'start_ts must be before end_ts' }, { status: 400 });
      }
    }

    // Insert new unavailability entries
    const entries = unavailability.map(entry => ({
      provider_id: user.id,
      start_ts: entry.start_ts,
      end_ts: entry.end_ts,
      reason: entry.reason || null
    }));

    const { data: newUnavailability, error: insertError } = await supabase
      .from('provider_unavailability')
      .insert(entries)
      .select();

    if (insertError) {
      console.error('Error inserting unavailability:', insertError);
      return NextResponse.json({ error: 'Failed to save unavailability' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      unavailability: newUnavailability,
      message: 'Unavailability blocks created successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 