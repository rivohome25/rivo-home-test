import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => req.cookies });
    
    // 1) Authenticated provider
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    if (userErr || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2) Parse JSON (all required onboarding fields)
    let body: {
      name: string;
      business_name: string;
      email: string;
      phone: string;
      zip_code: string;
      services_offered: string[];
      service_radius: number;
      license_url?: string;
      license_number?: string;
      license_state?: string;
      insurance_url?: string;
      bio: string;
      logo_url?: string;
      portfolio_urls?: string[];
      social_links?: Record<string, string>;
      google_yelp_links?: string[];
      testimonials?: string[];
      background_consent: boolean;
      agreements_signed: { 
        provider_agreement: boolean; 
        code_of_conduct: boolean; 
        nondiscrimination: boolean 
      };
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // 3) Validate required fields
    if (!body.name || !body.business_name || !body.email || !body.phone || 
        !body.zip_code || !body.services_offered || body.services_offered.length === 0 ||
        !body.service_radius || !body.bio || !body.background_consent ||
        !body.agreements_signed?.provider_agreement || 
        !body.agreements_signed?.code_of_conduct ||
        !body.agreements_signed?.nondiscrimination) {
      return NextResponse.json({ 
        error: "Missing required fields or agreements not signed" 
      }, { status: 400 });
    }

    // 4) Check if user already has an active provider profile or pending application
    const { data: existingProfile } = await supabase
      .from("provider_profiles")
      .select("is_active")
      .eq("user_id", user.id)
      .single();

    if (existingProfile?.is_active) {
      return NextResponse.json({ 
        error: "User already has an active provider profile" 
      }, { status: 400 });
    }

    const { data: existingApp } = await supabase
      .from("provider_applications")
      .select("status")
      .eq("user_id", user.id)
      .single();

    if (existingApp && existingApp.status === 'pending') {
      return NextResponse.json({ 
        error: "User already has a pending application" 
      }, { status: 400 });
    }

    // 5) Insert into provider_applications
    const insertPayload = {
      user_id: user.id,
      name: body.name,
      business_name: body.business_name,
      email: body.email,
      phone: body.phone,
      zip_code: body.zip_code,
      services_offered: body.services_offered,
      service_radius: body.service_radius,
      license_url: body.license_url || null,
      license_number: body.license_number || null,
      license_state: body.license_state || null,
      insurance_url: body.insurance_url || null,
      bio: body.bio,
      logo_url: body.logo_url || null,
      portfolio_urls: body.portfolio_urls || [],
      social_links: body.social_links || {},
      google_yelp_links: body.google_yelp_links || [],
      testimonials: body.testimonials || [],
      background_consent: body.background_consent,
      agreements_signed: body.agreements_signed,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("provider_applications")
      .insert([insertPayload])
      .select("id")
      .single();

    if (insertErr) {
      console.error("Error inserting application:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      application_id: inserted.id,
      message: "Application submitted successfully for admin review"
    });

  } catch (error) {
    console.error("Error in provider application API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => req.cookies });
    
    // Get current user's application status
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    if (userErr || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: application, error } = await supabase
      .from("provider_applications")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching application:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ application: application || null });

  } catch (error) {
    console.error("Error in get provider application API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 