import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's support tickets
    const { data: tickets, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching support tickets:", error);
      return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Support tickets GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, description } = body;

    if (!subject || !description) {
      return NextResponse.json({ 
        error: "Subject and description are required" 
      }, { status: 400 });
    }

    // Check if user has Premium plan for priority support
    const { data: userPlan, error: planError } = await supabase
      .from("user_plans")
      .select("max_homes")
      .eq("user_id", user.id)
      .single();

    // Premium users have max_homes = NULL, they get high priority
    const isPremium = userPlan?.max_homes === null;
    const priority = isPremium ? "high" : "normal";

    // Create support ticket
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        status: "open"
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating support ticket:", error);
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }

    return NextResponse.json({ 
      ticket, 
      message: isPremium ? "Priority support ticket created successfully" : "Support ticket created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Support tickets POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 