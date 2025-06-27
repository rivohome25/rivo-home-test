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
      console.log('Admin analytics API: No session found');
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.log('Admin analytics API: User is not an admin', session.user.id);
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    console.log('Admin analytics API: Fetching data for admin', session.user.id);
    
    // Get various analytics data
    const [
      totalUsersResult,
      totalProvidersResult,
      activeSubscribersResult,
      pendingApplicationsResult,
      recentSignupsResult
    ] = await Promise.all([
      // Total users count
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact" }),
      
      // Total providers count
      supabaseAdmin
        .from("provider_profiles")
        .select("user_id", { count: "exact" }),
      
      // Active subscribers count
      supabaseAdmin
        .from("user_plans")
        .select("user_id", { count: "exact" })
        .eq("is_active", true),
      
      // Pending provider applications
      supabaseAdmin
        .from("provider_applications")
        .select("id", { count: "exact" })
        .eq("status", "pending"),
      
      // Recent signups (last 30 days)
      supabaseAdmin
        .from("profiles")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Check for errors in any of the queries
    const errors = [
      totalUsersResult.error,
      totalProvidersResult.error,
      activeSubscribersResult.error,
      pendingApplicationsResult.error,
      recentSignupsResult.error
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error("Admin analytics API: Database errors:", errors);
      return NextResponse.json({ error: "Database error", details: errors }, { status: 500 });
    }

    // Calculate daily signups for the chart
    const recentSignups = recentSignupsResult.data || [];
    const dailySignups = recentSignups.reduce((acc: any[], profile: any) => {
      const date = new Date(profile.created_at).toISOString().split('T')[0];
      const existing = acc.find(item => item.day === date);
      if (existing) {
        existing.signup_count++;
      } else {
        acc.push({ day: date, signup_count: 1 });
      }
      return acc;
    }, []);

    // Sort by date descending
    dailySignups.sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime());

    const analyticsData = {
      totalUsers: totalUsersResult.count || 0,
      totalProviders: totalProvidersResult.count || 0,
      activeSubscribers: activeSubscribersResult.count || 0,
      pendingApplications: pendingApplicationsResult.count || 0,
      dailySignups: dailySignups.slice(0, 30), // Last 30 days
      recentSignupsCount: recentSignups.length || 0
    };

    console.log('Admin analytics API: Successfully fetched data');
    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error("Admin analytics API: Unexpected error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch analytics", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 