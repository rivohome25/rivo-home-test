import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Parse JSON body: { provider_id, subject, message }
  let body: { provider_id: string; subject: string; message: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  
  const { provider_id, subject, message } = body;
  if (!provider_id || !subject || !message) {
    return NextResponse.json(
      { error: "provider_id, subject, and message are required" },
      { status: 400 }
    );
  }

  try {
    // Insert into provider_messages
    const { data: messageData, error: insertError } = await supabase
      .from("provider_messages")
      .insert([
        {
          homeowner_id: user.id,
          provider_id: provider_id,
          subject,
          message,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting provider_message:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Get provider details for email notification
    const { data: providerProfile, error: providerError } = await supabase
      .from("provider_profiles")
      .select("business_name, email")
      .eq("user_id", provider_id)
      .single();

    if (!providerError && providerProfile) {
      // Get homeowner name for email
      const { data: homeownerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Send email notification via MailerSend Edge Function
      try {
        const sendEmailUrl = `${process.env.SUPABASE_URL}/functions/v1/send-email`;
        const emailBody = {
          to: providerProfile.email,
          subject: `New Quote Request: ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">New Quote Request from RivoHome</h2>
              <p>Hi <strong>${providerProfile.business_name}</strong>,</p>
              <p>You have received a new quote request from a homeowner:</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>From:</strong> ${homeownerProfile?.full_name || 'A homeowner'}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/provider-messages" 
                   style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View All Messages
                </a>
              </p>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Thanks,<br/>
                The RivoHome Team
              </p>
            </div>
          `,
        };

        const response = await fetch(sendEmailUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(emailBody),
        });

        if (!response.ok) {
          console.warn("Failed to send email notification:", await response.text());
        }
      } catch (emailError) {
        console.warn("Error sending email notification:", emailError);
        // Don't fail the message creation if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: messageData 
    });
  } catch (error) {
    console.error("Unexpected error in provider messaging:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Get user role to determine what messages to show
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    let query = supabase
      .from("provider_messages")
      .select(`
        id,
        subject,
        message,
        created_at,
        read_at,
        archived_at,
        homeowner_id,
        provider_id,
        profiles!provider_messages_homeowner_id_fkey(full_name),
        provider_profiles!provider_messages_provider_id_fkey(business_name)
      `)
      .order("created_at", { ascending: false });

    // Filter based on user role
    if (profile?.role === "provider") {
      query = query.eq("provider_id", user.id);
    } else {
      query = query.eq("homeowner_id", user.id);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Unexpected error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
} 