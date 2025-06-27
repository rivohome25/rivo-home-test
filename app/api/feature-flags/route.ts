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

    // Get all feature flags
    const { data: features, error } = await supabase
      .from("feature_flags")
      .select("*")
      .eq("enabled", true)
      .order("name");

    if (error) {
      console.error("Error fetching feature flags:", error);
      return NextResponse.json({ error: "Failed to fetch features" }, { status: 500 });
    }

    // For each feature, check if user has access
    const accessibleFeatures = [];
    
    for (const feature of features) {
      const { data: hasAccess, error: accessError } = await supabase
        .rpc("user_has_feature_access", {
          user_uuid: user.id,
          feature_name: feature.name
        });

      if (!accessError && hasAccess) {
        accessibleFeatures.push({
          name: feature.name,
          description: feature.description,
          beta_only: feature.beta_only,
          enabled: true
        });
      }
    }

    return NextResponse.json({ features: accessibleFeatures });
  } catch (error) {
    console.error("Feature flags GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 