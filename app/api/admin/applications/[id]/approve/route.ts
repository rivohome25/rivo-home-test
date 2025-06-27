import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (req.headers.get("x-admin-secret") !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const appId = params.id;

  // 1) Get the application
  const { data: app, error: getErr } = await supabaseAdmin
    .from("provider_applications")
    .select("*")
    .eq("id", appId)
    .single();
  if (getErr || !app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // 2) Update status to 'approved'
  const { error: updErr } = await supabaseAdmin
    .from("provider_applications")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: req.headers.get("x-admin-user"),
    })
    .eq("id", appId);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // 3) Insert into provider_profiles
  const payload = {
    user_id: app.user_id,
    full_name: app.name,
    business_name: app.business_name,
    email: app.email,
    phone: app.phone,
    zip_code: app.zip_code,
    bio: app.bio,
    logo_url: app.logo_url,
    portfolio: app.portfolio_urls || [],
    social_links: app.social_links || [],
    background_check_consent: app.background_consent,
    onboarding_status: "pending",
    review_status: "approved"
  };
  const { error: profErr } = await supabaseAdmin
    .from("provider_profiles")
    .insert([payload]);
  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 