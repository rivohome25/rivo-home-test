"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Application = {
  id: string;
  user_id: string;
  name: string;
  business_name: string;
  email: string;
  phone: string;
  zip_code: string;
  services_offered: string[];
  service_radius: number;
  license_url: string;
  license_number: string;
  license_state: string;
  insurance_url: string;
  bio: string;
  logo_url: string;
  portfolio_urls: string[];
  social_links: Record<string, string>;
  google_yelp_links: string[];
  testimonials: string[];
  background_consent: boolean;
  agreements_signed: { 
    provider_agreement: boolean; 
    code_of_conduct: boolean; 
    nondiscrimination: boolean 
  };
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
};

export default function AdminProviderApplicationsPage() {
  const supabase = createClientComponentClient();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  const fetchApps = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/provider-applications", {
        method: "GET",
        credentials: 'include'
      });
      
      if (!res.ok) {
        const json = await res.json();
        setErrorMsg(json.error || "Failed to fetch applications");
        setLoading(false);
        return;
      }
      
      const json = await res.json();
      setApps(json.applications || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setErrorMsg("Failed to fetch applications");
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleReview = async (appId: string, action: "approve" | "reject") => {
    let reason: string | undefined;
    if (action === "reject") {
      reason = prompt("Enter rejection reason:");
      if (!reason || reason.trim() === "") {
        alert("Rejection reason is required.");
        return;
      }
    }

    setActionLoading(appId);

    try {
      const res = await fetch(`/api/admin/provider-applications/${appId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ action, rejection_reason: reason }),
      });
      
      if (!res.ok) {
        const json = await res.json();
        alert(json.error || "Failed to review application");
      } else {
        const json = await res.json();
        alert(json.message || "Application reviewed successfully");
        fetchApps();
      }
    } catch (error) {
      console.error("Error reviewing application:", error);
      alert("Failed to review application");
    }

    setActionLoading(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Provider Applications</h1>
        <p className="text-gray-600">Review and approve provider applications</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : errorMsg ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-800 mb-4">{errorMsg}</div>
      ) : apps.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No applications found.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Total applications: {apps.length} | 
            Pending: {apps.filter(a => a.status === 'pending').length} | 
            Approved: {apps.filter(a => a.status === 'approved').length} | 
            Rejected: {apps.filter(a => a.status === 'rejected').length}
          </div>

          <div className="space-y-4">
            {apps.map((app) => (
              <div key={app.id} className="bg-white border rounded-lg shadow-sm">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold">{app.business_name}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(app.status)}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Contact:</span>
                          <div>{app.name}</div>
                          <div className="text-blue-600">{app.email}</div>
                          <div>{app.phone}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <div>{app.zip_code}</div>
                          <div>Radius: {app.service_radius} miles</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Services:</span>
                          <div className="text-xs">{app.services_offered.join(", ")}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Submitted:</span>
                          <div>{new Date(app.submitted_at).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(app.submitted_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      {app.status !== "pending" && (
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <div className="flex items-center gap-4">
                            <span className="font-medium">
                              Reviewed: {app.reviewed_at ? new Date(app.reviewed_at).toLocaleString() : 'N/A'}
                            </span>
                            {app.status === "rejected" && app.rejection_reason && (
                              <span className="text-red-600">
                                Reason: {app.rejection_reason}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                        className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
                      >
                        {expandedApp === app.id ? 'Hide Details' : 'View Details'}
                      </button>

                      {app.status === "pending" && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleReview(app.id, "approve")}
                            disabled={actionLoading === app.id}
                            className="rounded bg-green-600 px-3 py-1 text-white text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading === app.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReview(app.id, "reject")}
                            disabled={actionLoading === app.id}
                            className="rounded bg-red-600 px-3 py-1 text-white text-sm hover:bg-red-700 disabled:opacity-50"
                          >
                            {actionLoading === app.id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedApp === app.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2">Business Information</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">License #:</span> {app.license_number || 'Not provided'}</div>
                            <div><span className="font-medium">License State:</span> {app.license_state || 'Not provided'}</div>
                            <div><span className="font-medium">Background Consent:</span> {app.background_consent ? 'Yes' : 'No'}</div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Agreements</h4>
                          <div className="space-y-1 text-sm">
                            <div className={`${app.agreements_signed?.provider_agreement ? 'text-green-600' : 'text-red-600'}`}>
                              Provider Agreement: {app.agreements_signed?.provider_agreement ? '✓ Signed' : '✗ Not signed'}
                            </div>
                            <div className={`${app.agreements_signed?.code_of_conduct ? 'text-green-600' : 'text-red-600'}`}>
                              Code of Conduct: {app.agreements_signed?.code_of_conduct ? '✓ Signed' : '✗ Not signed'}
                            </div>
                            <div className={`${app.agreements_signed?.nondiscrimination ? 'text-green-600' : 'text-red-600'}`}>
                              Non-discrimination: {app.agreements_signed?.nondiscrimination ? '✓ Signed' : '✗ Not signed'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Bio</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{app.bio}</p>
                      </div>

                      {(app.testimonials && app.testimonials.length > 0) && (
                        <div>
                          <h4 className="font-semibold mb-2">Testimonials</h4>
                          <div className="space-y-2">
                            {app.testimonials.map((testimonial, index) => (
                              <p key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded italic">
                                "{testimonial}"
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {app.license_url && (
                          <div>
                            <span className="font-medium text-sm">License Document:</span>
                            <a 
                              href={app.license_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block text-blue-600 hover:underline text-sm"
                            >
                              View License
                            </a>
                          </div>
                        )}

                        {app.insurance_url && (
                          <div>
                            <span className="font-medium text-sm">Insurance Document:</span>
                            <a 
                              href={app.insurance_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block text-blue-600 hover:underline text-sm"
                            >
                              View Insurance
                            </a>
                          </div>
                        )}

                        {app.logo_url && (
                          <div>
                            <span className="font-medium text-sm">Logo:</span>
                            <img 
                              src={app.logo_url} 
                              alt="Company Logo" 
                              className="w-16 h-16 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>

                      {(app.portfolio_urls && app.portfolio_urls.length > 0) && (
                        <div>
                          <h4 className="font-semibold mb-2">Portfolio Images</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {app.portfolio_urls.map((url, index) => (
                              <img 
                                key={index}
                                src={url} 
                                alt={`Portfolio ${index + 1}`} 
                                className="w-full h-24 object-cover rounded border"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 