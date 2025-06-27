import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import crypto from "crypto";
import { addDays } from "date-fns";
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supabase: SupabaseClient = createRouteHandlerClient({ cookies });
  
  // 1) Authenticated homeowner
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2) Parse JSON: { property_id, days_valid? }
  let body: { property_id: string; days_valid?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { property_id, days_valid = 7 } = body;
  if (!property_id) {
    return NextResponse.json({ error: "property_id is required" }, { status: 400 });
  }

  // 3) Verify property belongs to user
  const { data: prop, error: propErr } = await supabase
    .from("properties")
    .select("id")
    .eq("id", property_id)
    .eq("user_id", user.id)
    .single();

  if (propErr || !prop) {
    return NextResponse.json({ error: "Property not found or not yours" }, { status: 404 });
  }

  // 4) Check if there's already a valid token (expires_at > now)
  const { data: existing, error: exErr } = await supabase
    .from("shared_reports")
    .select("id, token, expires_at")
    .eq("property_id", property_id)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!exErr && existing) {
    // Return existing valid token
    return NextResponse.json({
      token: existing.token,
      expires_at: existing.expires_at,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/shared-report/${existing.token}`
    });
  }

  // 5) Otherwise, generate a new token
  const token = crypto.randomBytes(16).toString("hex"); // 32-char hex
  const expiresAt = addDays(new Date(), days_valid).toISOString(); // default 7 days

  const { data: insertData, error: insertErr } = await supabase
    .from("shared_reports")
    .insert([{ property_id, token, expires_at: expiresAt }])
    .select("token, expires_at")
    .single();

  if (insertErr) {
    console.error("Error inserting shared_reports:", insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    token: insertData.token,
    expires_at: insertData.expires_at,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/shared-report/${insertData.token}`,
  });
} 