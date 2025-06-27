import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// PATCH /api/provider/bookings/[id] - Update booking status (approve/reject)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;
    const { status, provider_notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Valid status is required (pending, confirmed, cancelled)' 
      }, { status: 400 });
    }

    // Update the booking status (RLS ensures only the provider can update their bookings)
    const { data: updatedBooking, error: updateError } = await supabase
      .from('provider_bookings')
      .update({ 
        status,
        provider_notes: provider_notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('provider_id', user.id) // Ensure only the provider can update their bookings
      .select('*')
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found or not authorized' }, { status: 404 });
      }
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Get the booking with homeowner details for response
    const { data: bookingDetails, error: fetchError } = await supabase
      .from('view_provider_bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.warn('Could not fetch updated booking details:', fetchError);
    }

    const statusMessages = {
      confirmed: 'Booking confirmed successfully',
      cancelled: 'Booking cancelled successfully',
      pending: 'Booking status updated to pending'
    };

    return NextResponse.json({
      success: true,
      booking: bookingDetails || updatedBooking,
      message: statusMessages[status as keyof typeof statusMessages]
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/provider/bookings/[id] - Cancel a booking
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Cancel the booking (set status to cancelled instead of deleting)
    const { data: cancelledBooking, error: cancelError } = await supabase
      .from('provider_bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('provider_id', user.id) // Ensure only the provider can cancel their bookings
      .select('*')
      .single();

    if (cancelError) {
      if (cancelError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found or not authorized' }, { status: 404 });
      }
      console.error('Error cancelling booking:', cancelError);
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      booking: cancelledBooking,
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 