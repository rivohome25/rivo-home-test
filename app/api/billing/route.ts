import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Check if Stripe is configured
const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_PRICE_ID_CORE &&
  process.env.STRIPE_PRICE_ID_RIVOPRO
);

export async function GET(req: NextRequest) {
  try {
    // 1) Set up Supabase client
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // If Stripe is not configured, return minimal billing info
    if (!isStripeConfigured) {
      return NextResponse.json({
        plan_id: 1, // Default to Free plan
        stripe_customer_id: null,
        stripe_subscription_id: null,
        subscription_status: "free",
        current_period_end: null,
        upcoming_invoice: null,
        invoices: [],
      });
    }

    // Import Stripe only if configured
    const Stripe = require("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    // 2) Fetch user_plans row - handle case where user doesn't have a record yet
    const { data: upData, error: upError } = await supabase
      .from("user_plans")
      .select("plan_id, stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end")
      .eq("user_id", user.id)
      .single();

    // Handle the case where user doesn't have a user_plans record yet (PGRST116)
    if (upError && upError.code !== "PGRST116") {
      console.error("Error fetching user_plans:", upError);
      return NextResponse.json({ error: upError.message }, { status: 500 });
    }
    
    if (!upData || !upData.stripe_customer_id) {
      // User has never been to billing (e.g. still on Free without Stripe)
      return NextResponse.json({
        plan_id: upData?.plan_id || 1, // Default to Free plan if no record
        stripe_customer_id: null,
        stripe_subscription_id: null,
        subscription_status: "free",
        current_period_end: null,
        upcoming_invoice: null,
        invoices: [],
      });
    }

    const {
      plan_id,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_status,
      current_period_end,
    } = upData;

    // 3) Retrieve upcoming invoice (if any)
    let upcomingInvoice: any = null;
    try {
      upcomingInvoice = await stripe.invoices.createPreview({
        customer: stripe_customer_id,
      });
    } catch (e: any) {
      // If no upcoming invoice, Stripe throws an error
      if (e.code !== "invoice_upcoming_none") {
        console.error("Error fetching upcoming invoice:", e);
      }
      upcomingInvoice = null;
    }

    // 4) Fetch last 10 invoices
    const invoicesList = await stripe.invoices.list({
      customer: stripe_customer_id,
      limit: 10,
    });

    // 5) Send JSON response
    return NextResponse.json({
      plan_id,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_status,
      current_period_end,
      upcoming_invoice: upcomingInvoice
        ? {
            id: upcomingInvoice.id,
            amount_due: upcomingInvoice.amount_due,
            currency: upcomingInvoice.currency,
            due_date: upcomingInvoice.due_date,
          }
        : null,
      invoices: invoicesList.data.map((inv: any) => ({
        id: inv.id,
        amount_paid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        invoice_pdf: inv.invoice_pdf,
        hosted_invoice_url: inv.hosted_invoice_url,
        period_start: inv.period_start,
        period_end: inv.period_end,
        created: inv.created,
      })),
    });
  } catch (error) {
    console.error("Billing API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 