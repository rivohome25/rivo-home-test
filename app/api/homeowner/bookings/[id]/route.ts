import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// DELETE /api/homeowner/bookings/[id] - Cancel a homeowner's booking
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;
    console.log('DELETE request for booking ID:', id, 'by user:', user.id);

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Parse request body for cancellation reason
    let cancellationReason = '';
    try {
      const body = await req.json();
      cancellationReason = body.cancellationReason || '';
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!cancellationReason.trim()) {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
    }

    console.log('Attempting to cancel booking with reason:', cancellationReason);

    // Update the booking directly with cancellation
    const { data: updatedData, error: updateError } = await supabase
      .from('provider_bookings')
      .update({ 
        status: 'cancelled',
        homeowner_notes: cancellationReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('homeowner_id', user.id)
      .select('*');

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ 
        error: 'Failed to cancel booking',
        details: updateError.message 
      }, { status: 500 });
    }

    if (!updatedData || updatedData.length === 0) {
      console.error('No booking found or not authorized');
      return NextResponse.json({ 
        error: 'Booking not found or you are not authorized to cancel it' 
      }, { status: 404 });
    }

    console.log('Successfully cancelled booking:', updatedData[0]);

    return NextResponse.json({
      success: true,
      booking: updatedData[0],
      message: 'Booking cancelled successfully. The provider has been notified of your cancellation reason.'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH /api/homeowner/bookings/[id] - Update a homeowner's booking
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();
    const { notes } = body;

    // Prepare update fields
    const updateFields: any = {
      updated_at: new Date().toISOString()
    };

    if (notes !== undefined) {
      updateFields.homeowner_notes = notes;
    }

    // Update the booking
    const { data: updatedData, error: updateError } = await supabase
      .from('provider_bookings')
      .update(updateFields)
      .eq('id', id)
      .eq('homeowner_id', user.id)
      .select('*');

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    if (!updatedData || updatedData.length === 0) {
      return NextResponse.json({ error: 'Booking not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking: updatedData[0],
      message: 'Booking updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error in PATCH route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 