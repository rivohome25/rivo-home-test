import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Await params to get the id
    const { id } = await params
    
    // Fetch the provider profile with all related data
    const { data: provider, error } = await supabase
      .from('provider_profiles')
      .select(`
        *,
        provider_services (
          service_id,
          radius_miles,
          provider_services_master (
            id,
            name
          )
        ),
        provider_external_reviews (
          id,
          platform,
          url,
          testimonial
        ),
        provider_documents (
          id,
          doc_type,
          file_path,
          license_number,
          issuing_state,
          uploaded_at
        )
      `)
      .eq('user_id', id)
      .eq('review_status', 'approved')  // Use review_status instead of status
      .single()

    if (error) {
      console.error('Error fetching provider:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Provider not found or not approved' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data for easier consumption
    const transformedProvider = {
      id: provider.user_id,
      fullName: provider.full_name,
      businessName: provider.business_name,
      email: provider.email,
      phone: provider.phone,
      zipCode: provider.zip_code,
      bio: provider.bio,
      logoUrl: provider.logo_url,
      status: provider.review_status, // Map review_status to status for API compatibility
      backgroundCheck: provider.background_check_consent,
      createdAt: provider.created_at,
      updatedAt: provider.updated_at,
      services: provider.provider_services?.map((ps: any) => ({
        id: ps.service_id,
        name: ps.provider_services_master?.name,
        radius: ps.radius_miles
      })) || [],
      reviewLinks: provider.provider_external_reviews?.map((review: any) => ({
        id: review.id,
        platform: review.platform,
        url: review.url,
        testimonial: review.testimonial
      })) || [],
      documents: provider.provider_documents?.map((doc: any) => ({
        id: doc.id,
        type: doc.doc_type,
        licenseNumber: doc.license_number, // Keep this field but it might be null if column doesn't exist
        issuingState: doc.issuing_state,
        uploadedAt: doc.uploaded_at
      })) || [],
      // Portfolio and social links from the original profile
      portfolio: provider.portfolio || [],
      socialLinks: provider.social_links || []
    }

    return NextResponse.json(transformedProvider)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 