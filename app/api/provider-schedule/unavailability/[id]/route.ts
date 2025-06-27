import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * DELETE /api/provider-schedule/unavailability/[id]
 * Delete a specific unavailability block
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the unavailability block (RLS will ensure they can only delete their own)
    const { error } = await supabase
      .from('provider_unavailability')
      .delete()
      .eq('id', id)
      .eq('provider_id', user.id) // Extra safety check

    if (error) {
      console.error('Error deleting unavailability:', error)
      return NextResponse.json({ error: 'Failed to delete unavailability block' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Unavailability block deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 