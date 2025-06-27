import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Check if Stripe is configured
const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_WEBHOOK_SECRET &&
  process.env.STRIPE_PRICE_ID_CORE &&
  process.env.STRIPE_PRICE_ID_RIVOPRO
);

export async function POST(req: NextRequest) {
  try {
    // If Stripe is not configured, return early
    if (!isStripeConfigured) {
      return NextResponse.json({ received: true });
    }

    // Check if Supabase environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create Supabase client with service role for webhook processing
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Import Stripe only if configured
    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // 1) Gather the raw body & signature header
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // 2) Handle relevant event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        
        if (session.mode === "payment" && session.metadata?.reportId) {
          // This is a report purchase
          const { userId, propertyId, reportId } = session.metadata;

          if (userId && propertyId && reportId) {
            // Record the report download
            const { error } = await supabase
              .from('report_downloads')
              .insert({
                user_id: userId,
                property_id: propertyId,
                report_id: reportId,
                stripe_session_id: session.id,
                paid_at: new Date().toISOString()
              });

            if (error) {
              console.error('Error recording report download:', error);
            }
          }
        } else if (session.mode === "subscription" && session.subscription) {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const userId = session.subscription_data?.metadata?.supabase_user_id;

          if (userId) {
            // Fetch the subscription details
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            // Determine plan_id based on price
            const priceId = subscription.items.data[0]?.price.id;
            let planId: number;
            
            if (priceId === process.env.STRIPE_PRICE_ID_CORE) {
              planId = 2; // Core plan
            } else if (priceId === process.env.STRIPE_PRICE_ID_RIVOPRO) {
              planId = 3; // RivoPro plan
            } else {
              planId = 1; // Default to Free
            }

            // Update user_plans
            const { error } = await supabase
              .from("user_plans")
              .update({
                plan_id: planId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                subscription_status: subscription.status,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq("user_id", userId);

            if (error) {
              console.error("Error updating user_plans:", error);
            }
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;

        if (subscriptionId && invoice.lines.data[0]) {
          const periodEnd = invoice.lines.data[0].period.end;

          // Update user_plans by looking up user with this stripe_customer_id
          const { error } = await supabase
            .from("user_plans")
            .update({
              subscription_status: "active",
              current_period_end: new Date(periodEnd * 1000).toISOString(),
            })
            .eq("stripe_customer_id", customerId);

          if (error) {
            console.error("Error updating user_plans:", error);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const { error } = await supabase
          .from("user_plans")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error updating user_plans:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const { error } = await supabase
          .from("user_plans")
          .update({
            plan_id: 1, // Revert to Free plan
            subscription_status: "canceled",
            stripe_subscription_id: null,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error updating user_plans:", error);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Determine plan_id based on price
        const priceId = subscription.items.data[0]?.price.id;
        let planId: number;
        
        if (priceId === process.env.STRIPE_PRICE_ID_CORE) {
          planId = 2; // Core plan
        } else if (priceId === process.env.STRIPE_PRICE_ID_RIVOPRO) {
          planId = 3; // RivoPro plan
        } else {
          planId = 1; // Default to Free
        }

        const { error } = await supabase
          .from("user_plans")
          .update({
            plan_id: planId,
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error updating user_plans:", error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // 3) Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
} 