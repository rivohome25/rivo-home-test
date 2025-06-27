import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/provider/earnings - Fetch provider's earnings summary
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Provider earnings API: Authentication error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Provider earnings API: Fetching earnings for user:', user.id);

    // Fetch provider's earnings summary from the database view
    const { data: earnings, error } = await supabase
      .from('view_provider_earnings_summary')
      .select('*')
      .single();

    if (error) {
      console.error('Provider earnings API: Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch earnings data' }, { status: 500 });
    }

    console.log('Provider earnings API: Successfully fetched earnings:', earnings);

    // Transform the data to match the expected format
    const transformedEarnings = {
      this_week: {
        amount: Number(earnings?.this_week_amount) || 0,
        jobs: Number(earnings?.this_week_jobs) || 0
      },
      this_month: {
        amount: Number(earnings?.this_month_amount) || 0,
        jobs: Number(earnings?.this_month_jobs) || 0
      },
      year_to_date: {
        amount: Number(earnings?.year_to_date_amount) || 0,
        jobs: Number(earnings?.year_to_date_jobs) || 0
      }
    };

    return NextResponse.json({ 
      earnings: transformedEarnings,
      success: true
    });

  } catch (error) {
    console.error('Provider earnings API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 