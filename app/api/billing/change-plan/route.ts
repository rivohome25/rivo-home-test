import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Check if Stripe is configured
const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_PRICE_ID_CORE &&
  process.env.STRIPE_PRICE_ID_RIVOPRO
);

type ChangePlanBody = {
  target_plan: "free" | "core" | "rivopro";
};

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured) {
      return NextResponse.json(
        { error: "Payment processing is not configured yet. Please check back later." },
        { status: 503 }
      );
    }

    const body: ChangePlanBody = await req.json();
    const { target_plan } = body;
    
    if (!target_plan || !["free", "core", "rivopro"].includes(target_plan)) {
      return NextResponse.json({ error: "Invalid target plan" }, { status: 400 });
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

    // 2) Fetch current subscription info
    const { data: upData, error: upError } = await supabase
      .from("user_plans")
      .select("plan_id, stripe_customer_id, stripe_subscription_id, subscription_status")
      .eq("user_id", user.id)
      .single();

    if (upError) {
      console.error("Error fetching user_plans:", upError);
      return NextResponse.json({ error: upError.message }, { status: 500 });
    }
    
    const subscriptionId = upData?.stripe_subscription_id;
    if (!subscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    // 3) Initialize Stripe
    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    try {
      // 4) Handle different plan change scenarios
      if (target_plan === "free") {
        // Downgrade to free = cancel subscription at period end
        const canceled = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });

        // Update user_plans with new status
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
          message: "Your subscription will be canceled at the end of your billing period. You'll maintain access to premium features until then.",
          cancel_at_period_end: canceled.cancel_at_period_end,
          current_period_end: canceled.current_period_end,
        });

      } else {
        // Change to a different paid plan (e.g., Premium → Core)
        const targetPriceId = target_plan === "core" 
          ? process.env.STRIPE_PRICE_ID_CORE! 
          : process.env.STRIPE_PRICE_ID_RIVOPRO!;

        // Get current subscription to check current price
        const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const currentPriceId = currentSubscription.items.data[0]?.price.id;

        // Check if they're already on this plan
        if (currentPriceId === targetPriceId) {
          return NextResponse.json({ error: "You're already on this plan" }, { status: 400 });
        }

        // Update subscription with proration
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: currentSubscription.items.data[0].id,
            price: targetPriceId,
          }],
          proration_behavior: 'create_prorations', // This handles the billing fairly
        });

        // Determine new plan_id based on target
        let newPlanId: number;
        if (target_plan === "core") {
          newPlanId = 2; // Core plan
        } else if (target_plan === "rivopro") {
          newPlanId = 3; // RivoPro plan
        } else {
          newPlanId = 1; // Default to Free (shouldn't reach here)
        }

        // Update user_plans immediately
        const { error: updErr } = await supabase
          .from("user_plans")
          .update({
            plan_id: newPlanId,
            subscription_status: updatedSubscription.status,
            current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
          })
          .eq("user_id", user.id);

        if (updErr) {
          console.error("Error updating user_plans after plan change:", updErr);
        }

        const planNames: Record<string, string> = {
          "core": "Core ($7/month)",
          "rivopro": "Premium ($20/month)"
        };

        return NextResponse.json({ 
          status: updatedSubscription.status,
          message: `Your plan has been changed to ${planNames[target_plan]}. Billing changes will be reflected in your next invoice with appropriate prorations.`,
          current_period_end: updatedSubscription.current_period_end,
        });
      }

    } catch (stripeError: any) {
      console.error("Stripe plan change error:", stripeError);
      return NextResponse.json({ 
        error: stripeError.message || "Failed to change plan"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Plan change API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 