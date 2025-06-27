import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse FormData
    const formData = await req.formData()
    const provider_id = formData.get('provider_id') as string
    const slot_start = formData.get('slot_start') as string
    const slot_end = formData.get('slot_end') as string
    const service_type = formData.get('service_type') as string
    const description = formData.get('description') as string
    const homeowner_notes = formData.get('homeowner_notes') as string
    const image_count = parseInt(formData.get('image_count') as string || '0')

    // Validate required fields
    if (!provider_id || !slot_start || !slot_end || !service_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: provider_id, slot_start, slot_end, service_type' 
      }, { status: 400 })
    }

    // Validate dates
    const startDate = new Date(slot_start)
    const endDate = new Date(slot_end)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }
    
    if (startDate >= endDate) {
      return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 })
    }
    
    if (startDate <= new Date()) {
      return NextResponse.json({ error: 'Cannot book slots in the past' }, { status: 400 })
    }

    // Validate image count
    if (image_count > 5) {
      return NextResponse.json({ error: 'Maximum 5 images allowed' }, { status: 400 })
    }

    // Calculate slot duration in minutes
    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))

    // 1) Check if the slot is still available using get_available_slots
    const { data: availableSlots, error: slotError } = await supabase
      .rpc('get_available_slots', {
        p_provider: provider_id,
        p_from: slot_start,
        p_to: slot_end,
        p_slot_mins: durationMinutes
      })

    if (slotError) {
      console.error('Error checking slot availability:', slotError)
      return NextResponse.json({ error: 'Failed to check slot availability' }, { status: 500 })
    }

    // If get_available_slots returns an empty array, slot is taken or unavailable
    if (!availableSlots || availableSlots.length === 0) {
      return NextResponse.json({ 
        error: 'This time slot is no longer available' 
      }, { status: 409 })
    }

    // Check if the exact slot we want is in the available slots
    const exactSlotAvailable = availableSlots.some(slot => 
      new Date(slot.slot_start).getTime() === startDate.getTime() &&
      new Date(slot.slot_end).getTime() === endDate.getTime()
    )

    if (!exactSlotAvailable) {
      return NextResponse.json({ 
        error: 'The requested time slot is not available' 
      }, { status: 409 })
    }

    // 2) Insert the booking first
    const { data: newBooking, error: insertError } = await supabase
      .from('provider_bookings')
      .insert({
        provider_id,
        homeowner_id: user.id,
        start_ts: slot_start,
        end_ts: slot_end,
        status: 'pending',
        description: description || null,
        service_type,
        homeowner_notes: homeowner_notes || null,
        image_count: image_count
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating booking:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create booking. The slot may have been taken by another user.' 
      }, { status: 409 })
    }

    // 3) Upload images if any
    const imageUrls: string[] = []
    if (image_count > 0) {
      try {
        for (let i = 0; i < image_count; i++) {
          const imageFile = formData.get(`image_${i}`) as File
          if (imageFile) {
            // Create unique filename
            const fileExt = imageFile.name.split('.').pop()
            const fileName = `${user.id}/${newBooking.id}/${Date.now()}_${i}.${fileExt}`
            
            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('booking-images')
              .upload(fileName, imageFile, {
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error('Error uploading image:', uploadError)
              // Continue with other images, don't fail the entire booking
              continue
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('booking-images')
              .getPublicUrl(fileName)

            imageUrls.push(publicUrl)
          }
        }

        // Update booking with image URLs
        if (imageUrls.length > 0) {
          const { error: updateError } = await supabase
            .from('provider_bookings')
            .update({ 
              image_urls: imageUrls,
              image_count: imageUrls.length
            })
            .eq('id', newBooking.id)

          if (updateError) {
            console.error('Error updating booking with image URLs:', updateError)
            // Don't fail the booking, just log the error
          }
        }
      } catch (imageError) {
        console.error('Error processing images:', imageError)
        // Don't fail the booking for image upload errors
      }
    }

    return NextResponse.json({
      success: true,
      booking: { ...newBooking, image_urls: imageUrls },
      message: `Booking request submitted successfully! ${imageUrls.length > 0 ? `${imageUrls.length} image(s) uploaded.` : ''} The provider will be notified.`
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user role to determine which bookings to fetch
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let bookings
    
    if (profile?.role === 'provider') {
      // Fetch provider's bookings using the view
      const { data, error } = await supabase
        .from('view_provider_bookings')
        .select('*')
        .order('start_ts', { ascending: true })
      
      if (error) {
        console.error('Error fetching provider bookings:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      bookings = data
    } else {
      // Fetch homeowner's bookings using the view
      const { data, error } = await supabase
        .from('view_homeowner_bookings')
        .select('*')
        .order('start_ts', { ascending: true })
      
      if (error) {
        console.error('Error fetching homeowner bookings:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      bookings = data
    }

    return NextResponse.json({ bookings })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 