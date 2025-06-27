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

    // Parse query parameters for pagination and filtering
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '200');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const table_name = url.searchParams.get('table_name');
    const operation = url.searchParams.get('operation');

    // Build query
    let query = supabaseAdmin
      .from("audit_logs")
      .select(`
        id,
        table_name,
        operation,
        record_id,
        changed_by,
        changed_at,
        old_data,
        new_data
      `)
      .order("changed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters if provided
    if (table_name) {
      query = query.eq('table_name', table_name);
    }
    if (operation) {
      query = query.eq('operation', operation);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching audit logs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get count for pagination
    let countQuery = supabaseAdmin
      .from("audit_logs")
      .select("id", { count: "exact", head: true });

    if (table_name) {
      countQuery = countQuery.eq('table_name', table_name);
    }
    if (operation) {
      countQuery = countQuery.eq('operation', operation);
    }

    const { count } = await countQuery;

    return NextResponse.json({ 
      logs: data,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (offset + limit) < (count || 0)
      }
    });

  } catch (error) {
    console.error("Error in admin audit logs API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 