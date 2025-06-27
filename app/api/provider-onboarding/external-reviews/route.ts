import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { updateOnboardingProgress } from '@/lib/provider-onboarding-progress';

// Supported review platforms
const SUPPORTED_PLATFORMS = ['google', 'yelp', 'angi', 'bbb', 'facebook', 'other'];

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 1) Check auth
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 2) Parse payload
  const payload = await req.json();

  // 3) Build upsert array dynamically from supported platforms
  const entries = [];
  
  for (const platform of SUPPORTED_PLATFORMS) {
    const urlKey = `${platform}_url`;
    const testimonialKey = `${platform}_testimonial`;
    
    const url = payload[urlKey];
    const testimonial = payload[testimonialKey];
    
    if (typeof url === 'string' && url.trim()) {
      entries.push({
        provider_id: user.id,
        platform: platform,
        url: url.trim(),
        testimonial: testimonial && typeof testimonial === 'string' ? testimonial.trim() : null,
      });
    }
  }

  if (entries.length === 0) {
    return NextResponse.json({ 
      error: 'Please provide at least one review platform link' 
    }, { status: 400 });
  }

  // 4) First, delete existing entries for this provider to handle unchecked platforms
  const { error: deleteErr } = await supabase
    .from('provider_external_reviews')
    .delete()
    .eq('provider_id', user.id);

  if (deleteErr) {
    console.error('Failed to delete existing external reviews:', deleteErr);
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  // 5) Insert new entries
  const { error: insertErr } = await supabase
    .from('provider_external_reviews')
    .insert(entries);

  if (insertErr) {
    console.error('External reviews insert failed:', insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // 6) Update onboarding progress - Step 5 completed, move to Step 6
  try {
    await updateOnboardingProgress(user.id, 5, true)
    console.log('✅ Step 5 (external-reviews) completed, progress updated')
  } catch (progressError) {
    console.error('⚠️ Failed to update onboarding progress:', progressError)
    // Don't fail the request if progress tracking fails
  }

  // 7) Success
  return NextResponse.json({ 
    success: true,
    message: `Successfully saved ${entries.length} review platform${entries.length !== 1 ? 's' : ''}`,
    platforms: entries.map(e => e.platform),
    nextStep: '/provider-onboarding/background-check-consent'
  });
} 