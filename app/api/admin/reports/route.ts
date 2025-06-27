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

    // Parse query parameter to get specific report type
    const url = new URL(req.url);
    const reportType = url.searchParams.get('type');

    // If specific report type requested, return only that
    if (reportType) {
      const data = await fetchSpecificReport(reportType);
      return NextResponse.json({ [reportType]: data });
    }

    // Otherwise, fetch all reports
    const reports = await Promise.allSettled([
      fetchDailySignups(),
      fetchActiveSubscribers(),
      fetchUserHomeCounts(),
      fetchUserDocCounts(),
      fetchProviderBookingCounts(),
      fetchTaskTrends(),
      fetchHomeownerBookingCounts(),
      fetchUserTasksCompleted()
    ]);

    const [
      dailySignups,
      activeSubscribers,
      userHomeCounts,
      userDocCounts,
      providerBookingCounts,
      taskTrends,
      homeownerBookingCounts,
      userTasksCompleted
    ] = reports.map(r => r.status === 'fulfilled' ? r.value : []);

    return NextResponse.json({
      daily_signups: dailySignups,
      active_subscribers: activeSubscribers,
      user_home_counts: userHomeCounts,
      user_doc_counts: userDocCounts,
      provider_booking_counts: providerBookingCounts,
      task_trends: taskTrends,
      homeowner_booking_counts: homeownerBookingCounts,
      user_tasks_completed: userTasksCompleted
    });

  } catch (error) {
    console.error("Error in admin reports API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function fetchSpecificReport(reportType: string) {
  switch (reportType) {
    case 'daily_signups':
      return await fetchDailySignups();
    case 'active_subscribers':
      return await fetchActiveSubscribers();
    case 'user_home_counts':
      return await fetchUserHomeCounts();
    case 'user_doc_counts':
      return await fetchUserDocCounts();
    case 'provider_booking_counts':
      return await fetchProviderBookingCounts();
    case 'task_trends':
      return await fetchTaskTrends();
    case 'homeowner_booking_counts':
      return await fetchHomeownerBookingCounts();
    case 'user_tasks_completed':
      return await fetchUserTasksCompleted();
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

async function fetchDailySignups() {
  const { data, error } = await supabaseAdmin
    .from("view_daily_new_signups")
    .select("day, signup_count")
    .order("day", { ascending: false })
    .limit(30);
  
  if (error) throw error;
  return data;
}

async function fetchActiveSubscribers() {
  const { data, error } = await supabaseAdmin
    .from("view_active_subscribers")
    .select("active_count")
    .single();
  
  if (error) throw error;
  return data;
}

async function fetchUserHomeCounts() {
  const { data, error } = await supabaseAdmin
    .from("view_user_home_counts")
    .select("user_id, home_count")
    .order("home_count", { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data;
}

async function fetchUserDocCounts() {
  const { data, error } = await supabaseAdmin
    .from("view_user_document_counts")
    .select("user_id, doc_count")
    .order("doc_count", { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data;
}

async function fetchProviderBookingCounts() {
  const { data, error } = await supabaseAdmin
    .from("view_provider_booking_counts")
    .select("user_id, bookings_received")
    .order("bookings_received", { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data;
}

async function fetchTaskTrends() {
  const { data, error } = await supabaseAdmin
    .from("view_daily_tasks_completed")
    .select("day, completed_count")
    .order("day", { ascending: false })
    .limit(30);
  
  if (error) throw error;
  return data;
}

async function fetchHomeownerBookingCounts() {
  const { data, error } = await supabaseAdmin
    .from("view_homeowner_booking_counts")
    .select("user_id, bookings_made")
    .order("bookings_made", { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data;
}

async function fetchUserTasksCompleted() {
  const { data, error } = await supabaseAdmin
    .from("view_user_tasks_completed")
    .select("user_id, tasks_completed")
    .order("tasks_completed", { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data;
} 