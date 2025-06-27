import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse request body
    let body: { code: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { code } = body;
    
    if (!code) {
      return NextResponse.json({ 
        error: "code is required" 
      }, { status: 400 });
    }

    // Look up the discount code
    const { data: discountCode, error: lookupError } = await supabase
      .from("discount_codes")
      .select("code, percent_off, expires_at, usage_limit, usage_count")
      .eq("code", code.toUpperCase())
      .single();

    if (lookupError || !discountCode) {
      return NextResponse.json({ 
        error: "Invalid discount code" 
      }, { status: 404 });
    }

    // Check if code has expired
    if (new Date(discountCode.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: "This discount code has expired" 
      }, { status: 400 });
    }

    // Check if code usage limit reached
    if (discountCode.usage_count >= discountCode.usage_limit) {
      return NextResponse.json({ 
        error: "This discount code has already been used" 
      }, { status: 400 });
    }

    // Increment usage count
    const { error: updateError } = await supabase
      .from("discount_codes")
      .update({ usage_count: discountCode.usage_count + 1 })
      .eq("code", discountCode.code);

    if (updateError) {
      console.error("Error updating usage count:", updateError);
      // Continue anyway, user can retry if needed
    }

    return NextResponse.json({ 
      success: true, 
      percent_off: discountCode.percent_off,
      code: discountCode.code,
      message: `${discountCode.percent_off}% discount applied!`
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// GET endpoint to validate a code without redeeming it
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    
    if (!code) {
      return NextResponse.json({ 
        error: "code parameter is required" 
      }, { status: 400 });
    }

    // Look up the discount code
    const { data: discountCode, error: lookupError } = await supabase
      .from("discount_codes")
      .select("code, percent_off, expires_at, usage_limit, usage_count")
      .eq("code", code.toUpperCase())
      .single();

    if (lookupError || !discountCode) {
      return NextResponse.json({ 
        error: "Invalid discount code" 
      }, { status: 404 });
    }

    // Check validity without redeeming
    const isExpired = new Date(discountCode.expires_at) < new Date();
    const isUsedUp = discountCode.usage_count >= discountCode.usage_limit;

    return NextResponse.json({ 
      valid: !isExpired && !isUsedUp,
      code: discountCode.code,
      percent_off: discountCode.percent_off,
      expires_at: discountCode.expires_at,
      usage_count: discountCode.usage_count,
      usage_limit: discountCode.usage_limit,
      is_expired: isExpired,
      is_used_up: isUsedUp
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 