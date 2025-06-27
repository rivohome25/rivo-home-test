import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: providerId } = await params

  // Create Supabase client with auth
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Fetch the application details
  const { data: application, error: appError } = await supabase
    .from('view_pending_provider_applications')
    .select('*')
    .eq('user_id', providerId)
    .single()

  if (appError) {
    console.error(`GET /api/admin/applications/${providerId} error:`, appError)
    return NextResponse.json({ error: appError.message }, { status: 500 })
  }

  // Fetch additional information
  const [
    { data: documents, error: docsError },
    { data: services, error: servicesError },
    { data: externalReviews, error: reviewsError },
    { data: agreements, error: agreementsError },
    { data: history, error: historyError }
  ] = await Promise.all([
    // Documents
    supabase
      .from('provider_documents')
      .select('*')
      .eq('provider_id', providerId),
    
    // Services offered
    supabase
      .from('provider_services')
      .select('*, provider_services_master(name)')
      .eq('provider_id', providerId),
    
    // External reviews
    supabase
      .from('provider_external_reviews')
      .select('*')
      .eq('provider_id', providerId),
    
    // Agreements
    supabase
      .from('provider_agreements')
      .select('*')
      .eq('provider_id', providerId),
    
    // Status history
    supabase
      .from('provider_status_history')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
  ])

  // Check for any errors in the additional queries
  if (docsError || servicesError || reviewsError || agreementsError || historyError) {
    console.error('Error fetching provider application details:', {
      docsError, servicesError, reviewsError, agreementsError, historyError
    })
  }

  // Return all the data
  return NextResponse.json({
    application,
    documents: documents || [],
    services: services || [],
    externalReviews: externalReviews || [],
    agreements: agreements || [],
    history: history || []
  })
} 