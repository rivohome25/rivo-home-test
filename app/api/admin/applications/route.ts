import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    // Get the user session from cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.log('Admin applications API: No session found');
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.log('Admin applications API: User is not an admin', session.user.id);
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    console.log('Admin applications API: Fetching applications for admin', session.user.id);
    
    const { data, error } = await supabaseAdmin
      .from("view_provider_applications")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error('Admin applications API: Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Admin applications API: Successfully fetched', data?.length || 0, 'applications');
    return NextResponse.json({ applications: data });
    
  } catch (error) {
    console.error("Admin applications API: Unexpected error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch applications", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 