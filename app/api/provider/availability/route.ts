import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/provider/availability - Fetch provider's weekly schedule
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch provider's current availability
    const { data: availability, error } = await supabase
      .from('provider_availability')
      .select('*')
      .eq('provider_id', user.id)
      .order('day_of_week');

    if (error) {
      console.error('Error fetching availability:', error);
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }

    return NextResponse.json({ availability });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/provider/availability - Update provider's weekly schedule
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { availability } = await req.json();

    // Validate input
    if (!Array.isArray(availability)) {
      return NextResponse.json({ error: 'Availability must be an array' }, { status: 400 });
    }

    // Validate each availability entry
    for (const entry of availability) {
      if (typeof entry.day_of_week !== 'number' || entry.day_of_week < 0 || entry.day_of_week > 6) {
        return NextResponse.json({ error: 'Invalid day_of_week' }, { status: 400 });
      }
      if (!entry.start_time || !entry.end_time) {
        return NextResponse.json({ error: 'start_time and end_time are required' }, { status: 400 });
      }
    }

    // First, delete existing availability for this provider
    const { error: deleteError } = await supabase
      .from('provider_availability')
      .delete()
      .eq('provider_id', user.id);

    if (deleteError) {
      console.error('Error deleting existing availability:', deleteError);
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
    }

    // Insert new availability entries
    if (availability.length > 0) {
      const entries = availability.map(entry => ({
        provider_id: user.id,
        day_of_week: entry.day_of_week,
        start_time: entry.start_time,
        end_time: entry.end_time,
        buffer_mins: entry.buffer_mins || 15 // Default 15 min buffer
      }));

      const { data: newAvailability, error: insertError } = await supabase
        .from('provider_availability')
        .insert(entries)
        .select();

      if (insertError) {
        console.error('Error inserting availability:', insertError);
        return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        availability: newAvailability,
        message: 'Availability updated successfully'
      });
    }

    return NextResponse.json({ 
      success: true, 
      availability: [],
      message: 'Availability cleared successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 