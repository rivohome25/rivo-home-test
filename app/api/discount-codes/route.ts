import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user is a Founding Provider
    const { data: provProfile, error: provError } = await supabase
      .from("provider_profiles")
      .select("is_founding_provider")
      .eq("user_id", user.id)
      .single();

    if (provError || !provProfile || !provProfile.is_founding_provider) {
      return NextResponse.json({ 
        error: "Only Founding Providers can create discount codes" 
      }, { status: 403 });
    }

    // Parse request body
    let body: { 
      percent_off: number; 
      expires_in_days: number; 
      usage_limit?: number; 
      code?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { percent_off, expires_in_days, usage_limit = 1, code } = body;
    
    if (!percent_off || !expires_in_days) {
      return NextResponse.json({ 
        error: "percent_off and expires_in_days are required" 
      }, { status: 400 });
    }

    if (percent_off < 1 || percent_off > 100) {
      return NextResponse.json({ 
        error: "percent_off must be between 1 and 100" 
      }, { status: 400 });
    }

    if (usage_limit < 1) {
      return NextResponse.json({ 
        error: "usage_limit must be at least 1" 
      }, { status: 400 });
    }

    // Generate code if not provided
    const voucherCode = code?.trim().toUpperCase() || 
                       `FOUND${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    // Insert discount code
    const { data: inserted, error: insertError } = await supabase
      .from("discount_codes")
      .insert([
        {
          code: voucherCode,
          percent_off,
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
          usage_limit,
        },
      ])
      .select("*")
      .single();

    if (insertError) {
      console.error("Error creating discount code:", insertError);
      return NextResponse.json({ 
        error: insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      code: inserted.code, 
      expires_at: inserted.expires_at,
      percent_off: inserted.percent_off,
      usage_limit: inserted.usage_limit
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user is a Founding Provider
    const { data: provProfile, error: provError } = await supabase
      .from("provider_profiles")
      .select("is_founding_provider")
      .eq("user_id", user.id)
      .single();

    if (provError || !provProfile || !provProfile.is_founding_provider) {
      return NextResponse.json({ 
        error: "Only Founding Providers can view their discount codes" 
      }, { status: 403 });
    }

    // Get user's discount codes
    const { data: codes, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching discount codes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ codes });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 