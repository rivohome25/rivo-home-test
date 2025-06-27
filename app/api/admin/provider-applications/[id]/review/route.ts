import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Parse JSON: { action: 'approve' | 'reject', rejection_reason?: string }
    let body: { action: "approve" | "reject"; rejection_reason?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    
    const { action, rejection_reason } = body;
    const appId = params.id;

    // Validate action
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'" }, { status: 400 });
    }

    if (action === "reject" && !rejection_reason) {
      return NextResponse.json({ error: "Rejection reason required when rejecting" }, { status: 400 });
    }

    // Set audit context to track who made the change
    await supabaseAdmin.rpc('set_audit_context', { user_uuid: session.user.id });

    // Fetch the application
    const { data: app, error: appErr } = await supabaseAdmin
      .from("provider_applications")
      .select("*")
      .eq("id", appId)
      .single();
      
    if (appErr || !app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (app.status !== 'pending') {
      return NextResponse.json({ 
        error: `Application has already been ${app.status}` 
      }, { status: 400 });
    }

    const updates: any = {
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    };

    if (action === "approve") {
      updates.status = "approved";
    } else if (action === "reject") {
      updates.status = "rejected";
      updates.rejection_reason = rejection_reason;
    }

    // Update the application status
    const { error: updErr } = await supabaseAdmin
      .from("provider_applications")
      .update(updates)
      .eq("id", appId);
      
    if (updErr) {
      console.error("Error updating application:", updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    if (action === "approve") {
      // Create provider_profiles entry
      const payload = {
        user_id: app.user_id,
        full_name: app.name,
        business_name: app.business_name,
        phone: app.phone,
        zip_code: app.zip_code,
        services_offered: app.services_offered,
        service_radius: app.service_radius,
        license_url: app.license_url,
        license_number: app.license_number,
        license_state: app.license_state,
        insurance_url: app.insurance_url,
        bio: app.bio,
        logo_url: app.logo_url,
        portfolio_urls: app.portfolio_urls,
        social_links: app.social_links,
        google_yelp_links: app.google_yelp_links,
        testimonials: app.testimonials,
        background_consent: app.background_consent,
        agreements_signed: app.agreements_signed,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profErr } = await supabaseAdmin
        .from("provider_profiles")
        .insert([payload]);
        
      if (profErr) {
        console.error("Error creating provider profile:", profErr);
        return NextResponse.json({ error: profErr.message }, { status: 500 });
      }

      // Update user's role to 'provider' in profiles table
      const { error: roleErr } = await supabaseAdmin
        .from("profiles")
        .update({ role: 'provider' })
        .eq("id", app.user_id);
        
      if (roleErr) {
        console.error("Error updating user role:", roleErr);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ 
      success: true,
      message: action === "approve" 
        ? "Application approved and provider profile created successfully"
        : `Application rejected: ${rejection_reason}`
    });

  } catch (error) {
    console.error("Error in admin provider application review API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 