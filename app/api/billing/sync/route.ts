import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Check if Stripe is configured
const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_PRICE_ID_CORE &&
  process.env.STRIPE_PRICE_ID_RIVOPRO
);

export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    // 1) Get user
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2) Get user's stripe customer ID
    const { data: upData, error: upError } = await supabase
      .from("user_plans")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (upError || !upData?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
    }

    // Import Stripe
    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // 3) Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: upData.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    const subscription = subscriptions.data[0];

    // 4) Determine plan_id based on price
    const priceId = subscription.items.data[0]?.price.id;
    let planId: number;
    
    if (priceId === process.env.STRIPE_PRICE_ID_CORE) {
      planId = 2; // Core plan
    } else if (priceId === process.env.STRIPE_PRICE_ID_RIVOPRO) {
      planId = 3; // RivoPro plan
    } else {
      planId = 1; // Default to Free
    }

    // 5) Update user_plans
    const { error } = await supabase
      .from("user_plans")
      .upsert({
        user_id: user.id,
        plan_id: planId,
        stripe_customer_id: upData.stripe_customer_id,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating user_plans:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      planId, 
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end
      }
    });
  } catch (error) {
    console.error("Sync API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 