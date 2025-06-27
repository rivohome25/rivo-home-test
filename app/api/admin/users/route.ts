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
      console.log('Admin users API: No session found');
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      console.log('Admin users API: User is not an admin', session.user.id);
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    console.log('Admin users API: Fetching users for admin', session.user.id);
    
    // Join profiles → user_plans → plans
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        role,
        tier,
        full_name,
        phone,
        is_suspended,
        created_at,
        updated_at,
        user_plans (
          plan_id,
          started_at,
          is_active,
          canceled_at,
          subscription_status,
          current_period_end,
          plans (
            name,
            price
          )
        )
      `);

    if (error) {
      console.error('Admin users API: Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Also get user emails from auth.users using admin API
    const userIds = data?.map(p => p.id) || [];
    if (userIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Use auth admin API to get user details
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.warn("Admin users API: Could not fetch auth users:", authError);
    }

    // Filter auth users to match our profiles
    const filteredAuthUsers = authUsers?.filter(authUser => 
      userIds.includes(authUser.id)
    ) || [];

    // Combine the data
    const users = data?.map(profile => {
      const authUser = filteredAuthUsers.find(u => u.id === profile.id);
      
      // Use auth_created_at as the primary signup date since that's when the account was actually created
      // Fall back to profile created_at if auth data is missing
      const signupDate = authUser?.created_at || profile.created_at;
      
      // Get plan info
      const userPlan = profile.user_plans?.[0];
      const plan = userPlan?.plans;
      
      return {
        id: profile.id,
        email: authUser?.email || null,
        full_name: profile.full_name || null,
        role: profile.role,
        signup_date: signupDate,
        is_suspended: profile.is_suspended || false,
        plan: plan?.name || 'Free',
        plan_price: plan?.price || 0,
        plan_status: userPlan?.subscription_status || 'free',
        plan_started: userPlan?.started_at || null,
        canceled_at: userPlan?.canceled_at || null,
        balance: 0, // TODO: implement user wallet balance if needed
        created_at: profile.created_at,
        auth_created_at: authUser?.created_at || null
      };
    });

    console.log('Admin users API: Successfully fetched', users.length, 'users');
    return NextResponse.json({ users });
    
  } catch (error) {
    console.error("Admin users API: Unexpected error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch users", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 