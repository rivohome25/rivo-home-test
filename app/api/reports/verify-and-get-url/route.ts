import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 1) Get the logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { sessionId, propertyId, reportId } = await req.json();
    
    if (!sessionId || !propertyId || !reportId) {
      return NextResponse.json(
        { error: 'Session ID, Property ID, and Report ID are required' },
        { status: 400 }
      );
    }

    // 2) Check if payment was successful by looking for the record in report_downloads
    const { data: download, error: downloadError } = await supabase
      .from('report_downloads')
      .select('*')
      .eq('user_id', user.id)
      .eq('property_id', propertyId)
      .eq('report_id', reportId)
      .eq('stripe_session_id', sessionId)
      .single();

    if (downloadError || !download) {
      return NextResponse.json(
        { error: 'Payment verification failed. Please try again or contact support.' },
        { status: 400 }
      );
    }

    // 3) Payment verified - trigger download by returning success flag
    return NextResponse.json({ 
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 