import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if current user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ 
        error: "Admin access required" 
      }, { status: 403 });
    }

    // Parse request body
    let body: { is_founding: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { is_founding } = body;
    
    if (typeof is_founding !== "boolean") {
      return NextResponse.json({ 
        error: "is_founding must be a boolean" 
      }, { status: 400 });
    }

    // Update provider_profiles
    const { data: updated, error: updateError } = await supabase
      .from("provider_profiles")
      .update({ is_founding_provider: is_founding })
      .eq("user_id", params.id)
      .select("user_id, business_name, is_founding_provider")
      .single();

    if (updateError) {
      console.error("Error updating is_founding_provider:", updateError);
      return NextResponse.json({ 
        error: updateError.message 
      }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ 
        error: "Provider not found" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      provider: updated,
      message: `Provider ${updated.business_name} ${is_founding ? 'promoted to' : 'removed from'} Founding Provider status`
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if current user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ 
        error: "Admin access required" 
      }, { status: 403 });
    }

    // Get provider status
    const { data: provider, error } = await supabase
      .from("provider_profiles")
      .select("user_id, business_name, is_founding_provider, avg_rating, review_count")
      .eq("user_id", params.id)
      .single();

    if (error) {
      console.error("Error fetching provider:", error);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    if (!provider) {
      return NextResponse.json({ 
        error: "Provider not found" 
      }, { status: 404 });
    }

    return NextResponse.json({ provider });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 