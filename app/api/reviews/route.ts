import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse request body
    let body: { 
      booking_id: string; 
      provider_id: string; 
      rating: number; 
      comment?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { booking_id, provider_id, rating, comment } = body;
    
    if (!booking_id || !provider_id || !rating) {
      return NextResponse.json({ 
        error: "booking_id, provider_id, rating are required" 
      }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: "Rating must be between 1 and 5" 
      }, { status: 400 });
    }

    // Insert the review (RLS will ensure booking belongs to user and is completed)
    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert([
        {
          booking_id,
          reviewer_id: user.id,
          provider_id,
          rating,
          comment: comment || null,
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting review:", insertError);
      return NextResponse.json({ 
        error: insertError.message 
      }, { status: 500 });
    }

    // Refresh provider rating
    const { error: refreshError } = await supabase
      .rpc("refresh_provider_rating", { p_provider_id: provider_id });

    if (refreshError) {
      console.error("Error refreshing provider rating:", refreshError);
      // Continue anyway - review was saved
    }

    return NextResponse.json({ 
      success: true, 
      review_id: review.id,
      message: "Review submitted successfully"
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const providerId = url.searchParams.get("provider_id");
    const myReviews = url.searchParams.get("my_reviews") === "true";

    if (myReviews) {
      // Get reviews written by the current user
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select(`
          *,
          provider_bookings (
            start_ts,
            service_type
          )
        `)
        .eq("reviewer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user reviews:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ reviews });

    } else if (providerId) {
      // Get reviews for a specific provider (public view)
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          comment,
          created_at
        `)
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching provider reviews:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ reviews });

    } else {
      return NextResponse.json({ 
        error: "Either provider_id or my_reviews=true parameter required" 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 