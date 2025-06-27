import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { format, parseISO } from "date-fns";

// Import client-side component for PDF viewing
import SharedReportClient from "./SharedReportClient";

// Use service role for server-side data fetching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

type SharedParams = { token: string };

async function fetchSinglePropertyReportData(propertyId: string) {
  try {
    // Fetch property report summary
    const { data: reportData, error: reportError } = await supabaseAdmin
      .from('view_property_report_summary')
      .select('*')
      .eq('property_id', propertyId)
      .single();

    if (reportError) {
      console.error('Error loading report data:', reportError);
      return null;
    }

    // Fetch task history
    const { data: taskHistory, error: historyError } = await supabaseAdmin
      .from('user_task_history')
      .select('*')
      .eq('property_id', propertyId)
      .order('task_date', { ascending: false });

    if (historyError) {
      console.error('Error loading task history:', historyError);
    }

    // Fetch trust score data using RPC function
    const { data: trustScoreData, error: trustError } = await supabaseAdmin
      .rpc('get_property_report_data', { p_property_id: propertyId });

    if (trustError) {
      console.error('Error loading trust score data:', trustError);
    }

    return {
      property: reportData,
      taskHistory: taskHistory || [],
      trustScoreData: trustScoreData || [],
    };
  } catch (error) {
    console.error('Error fetching report data:', error);
    return null;
  }
}

export default async function SharedReportPage({ params }: { params: SharedParams }) {
  const { token } = params;

  // 1) Look up shared_reports using service role
  const { data: shared, error: sharedErr } = await supabaseAdmin
    .from("shared_reports")
    .select("property_id, expires_at")
    .eq("token", token)
    .single();

  if (sharedErr || !shared) {
    return notFound();
  }

  // 2) Check if expired
  if (new Date(shared.expires_at) < new Date()) {
    return notFound();
  }

  // 3) Fetch report data for the property
  const reportData = await fetchSinglePropertyReportData(shared.property_id);
  if (!reportData) {
    return notFound();
  }

  // 4) Render client-side component with the data
  return (
    <SharedReportClient 
      reportData={reportData}
      expiresAt={shared.expires_at}
    />
  );
} 