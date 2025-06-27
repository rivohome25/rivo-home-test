import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get provider profile with related data
    const { data: profile, error: profileError } = await supabase
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
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Transform the data to match the expected format
    if (profile) {
      // Ensure portfolio and social_links are properly formatted for the frontend
      profile.portfolio_urls = Array.isArray(profile.portfolio) ? profile.portfolio : [];
      profile.social_links = Array.isArray(profile.social_links) ? profile.social_links : [];
    }

    return NextResponse.json(profile || null);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Extract services and external review data for separate handling
    const { 
      services_offered, 
      service_radius, 
      google_link, 
      yelp_link, 
      angi_link,
      bbb_link,
      facebook_link,
      portfolio_urls,
      social_links,
      ...profileData 
    } = body;

    // Prepare portfolio and social_links data for database
    const portfolio = Array.isArray(portfolio_urls) ? portfolio_urls.filter(url => url && url.trim() !== '') : [];
    const socialLinks = Array.isArray(social_links) ? social_links.filter(url => url && url.trim() !== '') : [];

    // Update provider profile (including portfolio and social_links)
    const { data: profile, error: profileError } = await supabase
      .from('provider_profiles')
      .upsert({ 
        ...profileData, 
        user_id: user.id,
        portfolio: portfolio.length > 0 ? portfolio : null,
        social_links: socialLinks.length > 0 ? socialLinks : null,
        updated_at: new Date().toISOString() 
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Handle services if provided
    if (services_offered && Array.isArray(services_offered)) {
      // First, delete existing services for this provider
      await supabase
        .from('provider_services')
        .delete()
        .eq('provider_id', user.id);

      // Then insert new services
      if (services_offered.length > 0) {
        // Get service IDs from service names
        const { data: serviceIds, error: serviceError } = await supabase
          .from('provider_services_master')
          .select('id, name')
          .in('name', services_offered);

        if (serviceError) {
          console.error('Service lookup error:', serviceError);
        } else if (serviceIds && serviceIds.length > 0) {
          // Insert new service relationships
          const serviceInserts = serviceIds.map(service => ({
            provider_id: user.id,
            service_id: service.id,
            radius_miles: service_radius || 25
          }));

          const { error: insertError } = await supabase
            .from('provider_services')
            .insert(serviceInserts);

          if (insertError) {
            console.error('Service insert error:', insertError);
          }
        }
      }
    }

    // Handle external review links
    const reviewLinks = [
      { platform: 'google', url: google_link },
      { platform: 'yelp', url: yelp_link },
      { platform: 'angi', url: angi_link },
      { platform: 'bbb', url: bbb_link },
      { platform: 'facebook', url: facebook_link }
    ].filter(link => link.url && link.url.trim() !== '');

    if (reviewLinks.length > 0) {
      // Delete existing external reviews for this provider
      await supabase
        .from('provider_external_reviews')
        .delete()
        .eq('provider_id', user.id);

      // Insert new review links
      const reviewInserts = reviewLinks.map(link => ({
        provider_id: user.id,
        platform: link.platform,
        url: link.url,
        testimonial: null
      }));

      const { error: reviewError } = await supabase
        .from('provider_external_reviews')
        .insert(reviewInserts);

      if (reviewError) {
        console.error('Review insert error:', reviewError);
      }
    }

    // Return the updated profile with related data
    const { data: updatedProfile, error: fetchError } = await supabase
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
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Profile fetch error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Transform the data to match the expected format
    if (updatedProfile) {
      updatedProfile.portfolio_urls = Array.isArray(updatedProfile.portfolio) ? updatedProfile.portfolio : [];
      updatedProfile.social_links = Array.isArray(updatedProfile.social_links) ? updatedProfile.social_links : [];
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 