"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import HomeownerNavigationClient from "@/components/HomeownerNavigationClient";
import SettingsNavigation from "@/components/SettingsNavigation";
import SupportTicketForm from "@/components/SupportTicketForm";
import { formatDistanceToNow } from "date-fns";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

interface UserPlan {
  max_homes: number | null;
  plan_name: string;
}

export default function SupportPage() {
  const supabase = createClientComponentClient();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    fetchTickets();
    fetchUserPlan();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/support-tickets");
      const data = await response.json();
      
      if (response.ok) {
        setTickets(data.tickets || []);
      } else {
        console.error("Error fetching tickets:", data.error);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPlan = async () => {
    try {
      const { data, error } = await supabase
        .from("user_plans")
        .select(`
          max_homes,
          plans (name)
        `)
        .single();

      if (data && !error) {
        setUserPlan({
          max_homes: data.max_homes,
          plan_name: data.plans?.name || 'Free'
        });
      }
    } catch (error) {
      console.error("Error fetching user plan:", error);
    }
  };

  const isPremium = userPlan?.max_homes === null;

  const handleTicketSubmitted = () => {
    fetchTickets();
    setShowNewTicketForm(false);
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "high") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          High Priority
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Normal
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "open") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Open
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
      <div className="min-h-screen bg-gray-50">
        <HomeownerNavigationClient title="Settings" currentPage="settings" />
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-8 space-y-6">
          <SettingsNavigation userRole="homeowner" />
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading support tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeownerNavigationClient title="Settings" currentPage="settings" />
      
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 pb-8 space-y-6">
        <SettingsNavigation userRole="homeowner" />
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Support Center</h1>
                <p className="text-gray-600">
                  Get help with your RivoHome account and services
                </p>
              </div>
              
              <button
                onClick={() => setShowNewTicketForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Ticket
              </button>
            </div>
          </div>
        </div>

        {/* Premium Support Banner */}
        {isPremium && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Premium Priority Support Active</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    As a Premium subscriber, your tickets receive high priority with faster response times.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tickets List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Your Support Tickets</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {tickets.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No support tickets</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new support ticket.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowNewTicketForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Create ticket
                      </button>
                    </div>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div 
                      key={ticket.id}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {ticket.subject}
                            </h3>
                            {getPriorityBadge(ticket.priority)}
                            {getStatusBadge(ticket.status)}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {ticket.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Support Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Information</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Response Times</h4>
                  {isPremium ? (
                    <div className="text-sm text-gray-600">
                      <p className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        High Priority: 2-4 hours
                      </p>
                      <p className="text-xs text-gray-500">Premium subscribers get priority support</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        Standard: 24-48 hours
                      </p>
                      <p className="text-xs text-blue-600">
                        Upgrade to Premium for priority support
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Contact Methods</h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>📧 Support tickets (recommended)</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-blue-800 font-medium">Direct Email Support</p>
                      <a 
                        href="mailto:support@rivohome.com" 
                        className="text-blue-600 hover:text-blue-800 font-mono text-sm"
                      >
                        support@rivohome.com
                      </a>
                      <p className="text-xs text-blue-600 mt-1">
                        For urgent issues or direct assistance
                      </p>
                    </div>
                    <p>📞 Phone support (Premium only)</p>
                    <p>💬 Live chat (Premium only)</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Common Issues</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Account settings</p>
                    <p>• Property management</p>
                    <p>• Maintenance scheduling</p>
                    <p>• Billing questions</p>
                  </div>
                </div>
              </div>
            </div>

            {!isPremium && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Upgrade to Premium</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Get priority support, faster response times, and dedicated assistance.
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors">
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Submit Support Ticket</h2>
              <button
                onClick={() => setShowNewTicketForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <SupportTicketForm
                onTicketSubmitted={handleTicketSubmitted}
                onClose={() => setShowNewTicketForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">Ticket Details</h2>
                {getPriorityBadge(selectedTicket.priority)}
                {getStatusBadge(selectedTicket.status)}
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedTicket.subject}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Created {formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    Our support team will respond to this ticket soon. You'll receive an email notification when there's an update.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 