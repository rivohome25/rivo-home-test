import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/provider/bookings - Fetch provider's bookings
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch provider's bookings with homeowner details
    const { data: bookings, error } = await supabase
      .from('view_provider_bookings')
      .select('*')
      .order('start_ts', { ascending: true });

    if (error) {
      console.error('Error fetching provider bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Group bookings by status for easier frontend handling
    const groupedBookings = {
      pending: bookings.filter(b => b.status === 'pending'),
      confirmed: bookings.filter(b => b.status === 'confirmed'),
      cancelled: bookings.filter(b => b.status === 'cancelled')
    };

    return NextResponse.json({ 
      bookings,
      grouped: groupedBookings,
      total: bookings.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 