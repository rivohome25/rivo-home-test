import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// DELETE /api/provider/unavailability/[id] - Remove a specific unavailability block
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
      return NextResponse.json({ error: 'Unavailability ID is required' }, { status: 400 });
    }

    // Delete the unavailability block (RLS will ensure only the owner can delete)
    const { data, error } = await supabase
      .from('provider_unavailability')
      .delete()
      .eq('id', id)
      .eq('provider_id', user.id) // Ensure only the owner can delete
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Unavailability block not found' }, { status: 404 });
      }
      console.error('Error deleting unavailability:', error);
      return NextResponse.json({ error: 'Failed to delete unavailability' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      deleted: data,
      message: 'Unavailability block removed successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 