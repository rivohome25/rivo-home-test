import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 1) Get the logged-in user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2) Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_REPORT_PRICE_ID) {
      return NextResponse.json(
        { error: 'Payment processing is not configured yet' },
        { status: 503 }
      );
    }

    const { propertyId, reportId } = await req.json();
    
    if (!propertyId || !reportId) {
      return NextResponse.json(
        { error: 'Property ID and Report ID are required' },
        { status: 400 }
      );
    }

    // 3) Verify user owns this property
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id, address')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single();

    if (propError || !property) {
      return NextResponse.json(
        { error: 'Property not found or unauthorized' },
        { status: 404 }
      );
    }

    // 4) Import Stripe and create checkout session
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user.email!,
      line_items: [{
        price: process.env.STRIPE_REPORT_PRICE_ID!,
        quantity: 1,
      }],
      mode: 'payment',
      metadata: { 
        userId: user.id, 
        propertyId,
        reportId,
        address: property.address
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reports/success?session_id={CHECKOUT_SESSION_ID}&property_id=${propertyId}&report_id=${reportId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/properties`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 