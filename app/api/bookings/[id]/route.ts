import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { status, notes } = body

    // Validate status
    const validStatuses = ['pending', 'scheduled', 'completed', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    // First, check if the booking exists and user has permission
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user has permission to update this booking
    const isHomeowner = existingBooking.homeowner_id === user.id
    const isProvider = existingBooking.provider_id === user.id

    if (!isHomeowner && !isProvider) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Business logic for status transitions
    if (isProvider && status === 'scheduled' && existingBooking.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Can only accept pending bookings' 
      }, { status: 400 })
    }

    if (isHomeowner && status === 'scheduled') {
      return NextResponse.json({ 
        error: 'Only providers can confirm bookings' 
      }, { status: 400 })
    }

    // Update the booking
    const updateData: any = { status }
    if (notes) {
      updateData.notes = notes
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        provider_profiles!bookings_provider_id_fkey (
          business_name,
          full_name,
          phone,
          email
        ),
        service_types (
          name
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating booking:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Return success message based on status
    let message = 'Booking updated successfully'
    switch (status) {
      case 'scheduled':
        message = 'Booking confirmed! The homeowner will be notified.'
        break
      case 'cancelled':
        message = 'Booking cancelled. The other party will be notified.'
        break
      case 'completed':
        message = 'Booking marked as completed.'
        break
    }

    return NextResponse.json({ 
      success: true, 
      booking: updatedBooking,
      message
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch the booking with related data
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        provider_profiles!bookings_provider_id_fkey (
          business_name,
          full_name,
          phone,
          email,
          bio,
          logo_url
        ),
        service_types (
          name
        ),
        homeowner:profiles!bookings_homeowner_id_fkey (
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user has permission to view this booking
    const isHomeowner = booking.homeowner_id === user.id
    const isProvider = booking.provider_id === user.id

    if (!isHomeowner && !isProvider) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    return NextResponse.json(booking)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 