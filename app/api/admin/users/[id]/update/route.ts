import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    const userId = params.id;
    
    // Parse request body
    let body: { 
      action: "suspend" | "reactivate" | "change_plan" | "adjust_balance";
      plan_id?: number;
      amount?: number;
    };
    
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { action, plan_id, amount } = body;

    // Set audit context to track who made the change
    await supabaseAdmin.rpc('set_audit_context', { user_uuid: session.user.id });

    switch (action) {
      case "suspend":
        const { error: suspendErr } = await supabaseAdmin
          .from("profiles")
          .update({ is_suspended: true })
          .eq("id", userId);
          
        if (suspendErr) {
          console.error("Error suspending user:", suspendErr);
          return NextResponse.json({ error: suspendErr.message }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: "User suspended successfully" 
        });

      case "reactivate":
        const { error: reactivateErr } = await supabaseAdmin
          .from("profiles")
          .update({ is_suspended: false })
          .eq("id", userId);
          
        if (reactivateErr) {
          console.error("Error reactivating user:", reactivateErr);
          return NextResponse.json({ error: reactivateErr.message }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: "User reactivated successfully" 
        });

      case "change_plan":
        if (!plan_id) {
          return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
        }

        // First check if user has existing plan
        const { data: existingPlan } = await supabaseAdmin
          .from("user_plans")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (existingPlan) {
          // Update existing plan
          const { error: updateErr } = await supabaseAdmin
            .from("user_plans")
            .update({ 
              plan_id,
              is_active: true,
              canceled_at: null,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);
            
          if (updateErr) {
            console.error("Error updating user plan:", updateErr);
            return NextResponse.json({ error: updateErr.message }, { status: 500 });
          }
        } else {
          // Create new plan
          const { error: insertErr } = await supabaseAdmin
            .from("user_plans")
            .insert([{
              user_id: userId,
              plan_id,
              is_active: true,
              started_at: new Date().toISOString()
            }]);
            
          if (insertErr) {
            console.error("Error creating user plan:", insertErr);
            return NextResponse.json({ error: insertErr.message }, { status: 500 });
          }
        }
        
        return NextResponse.json({ 
          success: true, 
          message: "Plan changed successfully" 
        });

      case "adjust_balance":
        if (amount === undefined || amount === null) {
          return NextResponse.json({ error: "amount is required" }, { status: 400 });
        }

        // Check if user has existing wallet
        const { data: existingWallet } = await supabaseAdmin
          .from("user_wallets")
          .select("balance")
          .eq("user_id", userId)
          .single();

        if (existingWallet) {
          // Update existing wallet
          const newBalance = Number(existingWallet.balance) + Number(amount);
          
          if (newBalance < 0) {
            return NextResponse.json({ 
              error: "Insufficient balance. Cannot go below $0.00" 
            }, { status: 400 });
          }

          const { error: updateErr } = await supabaseAdmin
            .from("user_wallets")
            .update({ 
              balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq("user_id", userId);
            
          if (updateErr) {
            console.error("Error updating wallet balance:", updateErr);
            return NextResponse.json({ error: updateErr.message }, { status: 500 });
          }
        } else {
          // Create new wallet
          const initialBalance = Math.max(0, Number(amount));
          
          const { error: insertErr } = await supabaseAdmin
            .from("user_wallets")
            .insert([{
              user_id: userId,
              balance: initialBalance
            }]);
            
          if (insertErr) {
            console.error("Error creating user wallet:", insertErr);
            return NextResponse.json({ error: insertErr.message }, { status: 500 });
          }
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `Balance adjusted by $${amount}` 
        });

      default:
        return NextResponse.json({ 
          error: "Invalid action. Must be 'suspend', 'reactivate', 'change_plan', or 'adjust_balance'" 
        }, { status: 400 });
    }

  } catch (error) {
    console.error("Error in admin user update API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 