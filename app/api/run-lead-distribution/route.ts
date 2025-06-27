import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Use service role client for admin operations
    const supabase = createClient(true); // true for service role

    // Call the lead distribution function
    const { error } = await supabase.rpc("distribute_daily_leads");

    if (error) {
      console.error("Error running distribute_daily_leads:", error);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Lead distribution completed successfully"
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
    
    // Check authentication and admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get lead distribution statistics
    const { data: stats, error: statsError } = await supabase
      .from("leads")
      .select(`
        status,
        assigned_at,
        provider_id
      `)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    if (statsError) {
      return NextResponse.json({ error: statsError.message }, { status: 500 });
    }

    // Calculate stats
    const totalLeads = stats?.length || 0;
    const assignedLeads = stats?.filter(lead => lead.status === 'assigned').length || 0;
    const unassignedLeads = stats?.filter(lead => lead.status === 'unassigned').length || 0;
    const closedLeads = stats?.filter(lead => lead.status === 'closed').length || 0;

    // Today's assignments
    const today = new Date().toISOString().split('T')[0];
    const todayAssignments = stats?.filter(lead => 
      lead.assigned_at && lead.assigned_at.startsWith(today)
    ).length || 0;

    return NextResponse.json({
      stats: {
        totalLeads,
        assignedLeads,
        unassignedLeads,
        closedLeads,
        todayAssignments
      }
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 