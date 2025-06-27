"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { formatDistanceToNow } from "date-fns";

interface Lead {
  id: string;
  homeowner_id: string;
  zip_code: string;
  service_type: string;
  status: string;
  created_at: string;
  assigned_at: string;
  closed_at: string | null;
}

export default function ProviderLeadsPage() {
  const supabase = createClientComponentClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Not authenticated");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("leads")
        .select("*")
        .eq("provider_id", user.id)
        .order("assigned_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching leads:", fetchError);
        setError(fetchError.message);
      } else {
        setLeads(data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const closeLead = async (leadId: string) => {
    const confirmed = confirm("Mark this lead as closed?");
    if (!confirmed) return;

    try {
      setLoading(true);
      
      const { error: updateError } = await supabase
        .from("leads")
        .update({ 
          status: "closed", 
          closed_at: new Date().toISOString() 
        })
        .eq("id", leadId);

      if (updateError) {
        console.error("Error closing lead:", updateError);
        setError(updateError.message);
      } else {
        // Refresh leads
        await fetchLeads();
      }
    } catch (err) {
      console.error("Close error:", err);
      setError("Failed to close lead");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "assigned") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Assigned
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Closed
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Leads</h1>
          <p className="text-gray-600">
            Manage your assigned leads and track customer inquiries
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-semibold text-gray-900">{leads.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Open Leads</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {leads.filter(lead => lead.status === 'assigned').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Closed Leads</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {leads.filter(lead => lead.status === 'closed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leads List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lead History</h2>
          </div>
          
          {leads.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No leads assigned</h3>
              <p className="mt-1 text-sm text-gray-500">
                Leads will appear here when they are assigned to you through our priority system.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {leads.map((lead) => (
                <div key={lead.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {lead.service_type}
                        </h3>
                        {getStatusBadge(lead.status)}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>ZIP Code:</strong> {lead.zip_code}</p>
                        <p><strong>Assigned:</strong> {formatDistanceToNow(new Date(lead.assigned_at), { addSuffix: true })}</p>
                        {lead.closed_at && (
                          <p><strong>Closed:</strong> {formatDistanceToNow(new Date(lead.closed_at), { addSuffix: true })}</p>
                        )}
                      </div>
                    </div>
                    
                    {lead.status === "assigned" && (
                      <button
                        onClick={() => closeLead(lead.id)}
                        className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        Close Lead
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="h-6 w-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About Lead Distribution</h3>
              <div className="text-sm text-blue-700 mt-2 space-y-1">
                <p>• Leads are distributed daily based on provider tier and availability</p>
                <p>• Founding Providers receive up to 10 leads per day with highest priority</p>
                <p>• Mark leads as "closed" once you've contacted the homeowner</p>
                <p>• Response time affects your priority in future lead assignments</p>
              </div>
            </div>
          </div>
        </div>
      </div></div>
  );
} 