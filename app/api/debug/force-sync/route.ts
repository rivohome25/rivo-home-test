import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    console.log("🔧 DEBUG: Force sync subscription");
    
    // 1) Get user
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log(`👤 DEBUG: User ID: ${user.id}`);

    // 2) Get user's current plan info
    const { data: upData, error: upError } = await supabase
      .from("user_plans")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (upError) {
      console.error("Error fetching user_plans:", upError);
      return NextResponse.json({ error: upError.message }, { status: 500 });
    }

    console.log(`📋 DEBUG: Current user plan:`, upData);

    if (!upData?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer ID found" }, { status: 404 });
    }

    // 3) Initialize Stripe
    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // 4) Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: upData.stripe_customer_id,
      status: 'active',
      limit: 10,
    });

    console.log(`🔄 DEBUG: Found ${subscriptions.data.length} active subscriptions`);

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ 
        error: "No active subscription found",
        debug: {
          stripe_customer_id: upData.stripe_customer_id,
          current_plan_id: upData.plan_id,
          subscription_status: upData.subscription_status
        }
      }, { status: 404 });
    }

    // 5) Sync the first active subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;
    
    console.log(`💳 DEBUG: Subscription details:`, {
      id: subscription.id,
      status: subscription.status,
      priceId: priceId,
      current_period_end: subscription.current_period_end
    });

    // Determine plan_id based on price
    let planId: number;
    let planName: string;
    
    if (priceId === process.env.STRIPE_PRICE_ID_CORE) {
      planId = 2; // Core plan
      planName = "Core";
    } else if (priceId === process.env.STRIPE_PRICE_ID_RIVOPRO) {
      planId = 3; // RivoPro plan  
      planName = "Premium";
    } else {
      planId = 1; // Default to Free
      planName = "Free";
    }

    console.log(`🎯 DEBUG: Syncing to plan_id: ${planId} (${planName})`);

    // 6) Update user_plans
    const { error: updateError } = await supabase
      .from("user_plans")
      .update({
        plan_id: planId,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("❌ Error updating user_plans:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log("✅ Successfully synced subscription!");

    return NextResponse.json({ 
      success: true,
      message: "Subscription synced successfully!",
      details: {
        previous_plan_id: upData.plan_id,
        new_plan_id: planId,
        plan_name: planName,
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error("Force sync error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
} 