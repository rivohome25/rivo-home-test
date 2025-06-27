import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Check if Stripe is configured
const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_PRICE_ID_CORE &&
  process.env.STRIPE_PRICE_ID_RIVOPRO
);

interface CheckoutBody {
  plan: "core" | "rivopro";
  return_to?: "billing" | "onboarding";
}

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured) {
      return NextResponse.json(
        { error: "Payment processing is not configured yet. Please check back later." },
        { status: 503 }
      );
    }

    const body: CheckoutBody = await req.json();
    const { plan, return_to = "billing" } = body;
    
    if (!plan) {
      return NextResponse.json({ error: "Plan is required" }, { status: 400 });
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

    // 2) Determine Stripe Price ID based on plan
    const priceId =
      plan === "core"
        ? process.env.STRIPE_PRICE_ID_CORE!
        : process.env.STRIPE_PRICE_ID_RIVOPRO!;
        
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // 3) Ensure we have (or create) a Stripe Customer for this user
    const { data: upData, error: upError } = await supabase
      .from("user_plans")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (upError && upError.code !== "PGRST116") {
      console.error("Error fetching user_plans:", upError);
      return NextResponse.json({ error: upError.message }, { status: 500 });
    }

    // Import Stripe only if configured
    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    let stripeCustomerId = upData?.stripe_customer_id;
    if (!stripeCustomerId) {
      // Create a new Stripe Customer
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      // Write back to user_plans (upsert in case row doesn't exist)
      const { error: updErr } = await supabase
        .from("user_plans")
        .upsert({ 
          user_id: user.id,
          plan_id: 1, // Default to Free plan
          stripe_customer_id: stripeCustomerId 
        })
        .eq("user_id", user.id);

      if (updErr) {
        console.error("Error updating stripe_customer_id:", updErr);
      }
    }

    // 4) Create appropriate success and cancel URLs based on return_to
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    
    let successURL: string;
    let cancelURL: string;
    
    if (return_to === "onboarding") {
      successURL = `${protocol}://${host}/onboarding/payment-success?session_id={CHECKOUT_SESSION_ID}`;
      cancelURL = `${protocol}://${host}/onboarding?step=2&payment_cancelled=true`;
    } else {
      // Default billing URLs
      successURL = `${protocol}://${host}/settings/billing/success?session_id={CHECKOUT_SESSION_ID}`;
      cancelURL = `${protocol}://${host}/settings/billing`;
    }

    // 5) Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      billing_address_collection: "required",
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          return_to: return_to,
        },
      },
      success_url: successURL,
      cancel_url: cancelURL,
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 