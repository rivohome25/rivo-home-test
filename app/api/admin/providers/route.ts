import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET → list all providers (with status, is_founding, avg_rating, etc.)
export async function GET(req: NextRequest) {
  try {
    // Get the user session from cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.log('Admin providers API: No session found');
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.log('Admin providers API: User is not an admin', session.user.id);
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    console.log('Admin providers API: Fetching providers for admin', session.user.id);
    
    const { data, error } = await supabaseAdmin
      .from("provider_profiles")
      .select(`
        user_id,
        full_name,
        business_name,
        email,
        phone,
        zip_code,
        bio,
        created_at,
        updated_at,
        onboarding_status,
        review_status
      `);

    if (error) {
      console.error('Admin providers API: Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Admin providers API: Successfully fetched', data?.length || 0, 'providers');
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Admin providers API: Unexpected error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch providers", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// PATCH → update provider status (e.g. deactivate, toggle founding, etc.)
export async function PATCH(req: NextRequest) {
  try {
    // Get the user session from cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.log('Admin providers API: No session found');
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.log('Admin providers API: User is not an admin', session.user.id);
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    let body: {
      user_id: string;
      onboarding_status?: string;
      review_status?: string;
    };
    
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    
    const { user_id, onboarding_status, review_status } = body;
    if (!user_id) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (onboarding_status !== undefined) updates.onboarding_status = onboarding_status;
    if (review_status !== undefined) updates.review_status = review_status;

    const { error } = await supabaseAdmin
      .from("provider_profiles")
      .update(updates)
      .eq("user_id", user_id);

    if (error) {
      console.error('Admin providers API: Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Admin providers API: Successfully updated provider status', user_id);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Admin providers API: Unexpected error:", error);
    return NextResponse.json({ 
      error: "Failed to update provider", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 