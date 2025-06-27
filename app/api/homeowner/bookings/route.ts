import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/homeowner/bookings - Fetch homeowner's bookings
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch homeowner's bookings with provider details
    const { data: bookings, error } = await supabase
      .from('view_homeowner_bookings')
      .select('*')
      .order('start_ts', { ascending: true });

    if (error) {
      console.error('Error fetching homeowner bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Separate upcoming and past bookings
    const now = new Date();
    const upcomingBookings = bookings.filter(b => new Date(b.start_ts) > now);
    const pastBookings = bookings.filter(b => new Date(b.start_ts) <= now);

    // Group by status for easier frontend handling
    const groupedBookings = {
      pending: bookings.filter(b => b.status === 'pending'),
      confirmed: bookings.filter(b => b.status === 'confirmed'),
      cancelled: bookings.filter(b => b.status === 'cancelled')
    };

    return NextResponse.json({ 
      bookings,
      upcoming: upcomingBookings,
      past: pastBookings,
      grouped: groupedBookings,
      total: bookings.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 