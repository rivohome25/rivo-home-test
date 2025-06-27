import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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

  // Extract query params: ?zip=XXXXX&service_type=Y
  const url = new URL(req.url);
  const zip = url.searchParams.get("zip") || "";
  const service = url.searchParams.get("service_type") || "";

  // Allow empty parameters for initial load or browsing all providers
  // if (!zip || !service) {
  //   return NextResponse.json(
  //     { error: "zip and service_type are required" },
  //     { status: 400 }
  //   );
  // }

  try {
    // Use the search function with correct parameter names
    const { data, error } = await supabase
      .rpc("search_providers", { 
        search_zip: zip, 
        search_service: service 
      });

    if (error) {
      console.error("Error searching providers:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      providers: data || [],
      count: data?.length || 0 
    });
  } catch (error) {
    console.error("Unexpected error in provider search:", error);
    return NextResponse.json(
      { error: "Failed to search providers" },
      { status: 500 }
    );
  }
} 