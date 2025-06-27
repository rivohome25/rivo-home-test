import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import ProviderProfileForm from '@/components/ProviderProfileForm';
import ProviderNavigation from '@/components/ProviderNavigation';

export default async function ProviderProfilePage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/sign-in');
  }

  // Check if user is a provider
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'provider') {
    redirect('/dashboard');
  }

  // Get provider profile with related data
  const { data: providerProfile, error: profileError } = await supabase
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

  // If no provider profile exists, redirect to onboarding
  if (profileError && profileError.code === 'PGRST116') {
    redirect('/provider-onboarding');
  }

  if (profileError) {
    console.error('Error fetching provider profile:', profileError);
    // Still render the form with empty data to allow profile creation
  }

  // Transform the data to match our form structure
  const formData = providerProfile ? {
    ...providerProfile,
    services_offered: providerProfile.provider_services?.map((s: any) => s.provider_services_master?.name) || [],
    service_radius: providerProfile.provider_services?.[0]?.radius_miles || 25,
    // Transform portfolio and social_links from database format to form format
    portfolio_urls: Array.isArray(providerProfile.portfolio) ? providerProfile.portfolio : [],
    social_links: Array.isArray(providerProfile.social_links) ? providerProfile.social_links : [],
  } : {
    full_name: '',
    business_name: '',
    email: user.email || '',
    phone: '',
    zip_code: '',
    bio: '',
    logo_url: '',
    services_offered: [],
    service_radius: 25,
    license_number: '',
    license_state: '',
    portfolio_urls: [],
    social_links: [],
    google_link: '',
    yelp_link: '',
    testimonials: []
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <ProviderNavigation 
        title="My Profile" 
        currentPage="my-profile"
      />

      {/* Provider Profile Form */}
      <ProviderProfileForm data={formData} />
    </div>
  );
} 