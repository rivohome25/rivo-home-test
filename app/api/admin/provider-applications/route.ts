import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Verify admin access via session
    const supabase = createRouteHandlerClient({ cookies: () => req.cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Fetch all pending or recently reviewed applications
    const { data, error } = await supabaseAdmin
      .from("provider_applications")
      .select(`
        id,
        user_id,
        name,
        business_name,
        email,
        phone,
        zip_code,
        services_offered,
        service_radius,
        license_url,
        license_number,
        license_state,
        insurance_url,
        bio,
        logo_url,
        portfolio_urls,
        social_links,
        google_yelp_links,
        testimonials,
        background_consent,
        agreements_signed,
        status,
        submitted_at,
        reviewed_at,
        reviewed_by,
        rejection_reason
      `)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching provider applications:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ applications: data });

  } catch (error) {
    console.error("Error in admin provider applications API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 