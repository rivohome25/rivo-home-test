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
    // Check if Stripe is configured
    if (!isStripeConfigured) {
      return NextResponse.json(
        { error: "Payment processing is not configured yet. Please check back later." },
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

    // 2) Fetch their subscription ID from user_plans
    const { data: upData, error: upError } = await supabase
      .from("user_plans")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (upError) {
      console.error("Error fetching user_plans:", upError);
      return NextResponse.json({ error: upError.message }, { status: 500 });
    }
    
    const subscriptionId = upData?.stripe_subscription_id;
    if (!subscriptionId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    // 3) Cancel subscription at period end
    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    try {
      const canceled = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      // 4) Update user_plans with new status + current_period_end
      const { error: updErr } = await supabase
        .from("user_plans")
        .update({
          subscription_status: canceled.status,
          current_period_end: new Date(canceled.current_period_end * 1000).toISOString(),
        })
        .eq("user_id", user.id);

      if (updErr) {
        console.error("Error updating user_plans after cancel:", updErr);
      }

      return NextResponse.json({ 
        status: canceled.status,
        cancel_at_period_end: canceled.cancel_at_period_end,
        current_period_end: canceled.current_period_end,
      });
    } catch (stripeError: any) {
      console.error("Stripe cancel error:", stripeError);
      return NextResponse.json({ error: stripeError.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Cancel API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 