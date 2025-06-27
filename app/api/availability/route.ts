import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const provider_id = url.searchParams.get('provider_id');
    const from_ts = url.searchParams.get('from');
    const to_ts = url.searchParams.get('to');
    const slot_mins = Number(url.searchParams.get('slot_mins') || '30');

    // Validate required parameters
    if (!provider_id || !from_ts || !to_ts) {
      return NextResponse.json(
        { error: 'Missing required parameters: provider_id, from, to' },
        { status: 400 }
      );
    }

    // Validate date formats
    try {
      new Date(from_ts);
      new Date(to_ts);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    // Use route handler client with proper authentication
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Call the RPC function
    const { data, error } = await supabase
      .rpc('get_available_slots', {
        p_provider: provider_id,
        p_from: from_ts,
        p_to: to_ts,
        p_slot_mins: slot_mins
      });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch available slots', details: error.message },
        { status: 500 }
      );
    }

    // Group slots by date for easier frontend consumption
    const groupedSlots = data.reduce((acc: any, slot: any) => {
      const date = new Date(slot.slot_start).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(slot);
      return acc;
    }, {});

    const response = {
      slots: data,
      grouped_slots: groupedSlots,
      total_slots: data.length
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
} 