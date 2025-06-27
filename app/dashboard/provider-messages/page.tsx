"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import ProviderNavigationClient from "@/components/ProviderNavigationClient";
import { Mail, MailOpen, Clock, User } from "lucide-react";

type Message = {
  id: string;
  subject: string;
  message: string;
  created_at: string;
  read_at: string | null;
  archived_at: string | null;
  homeowner_id: string;
  provider_id: string;
  profiles: {
    full_name: string;
  } | null;
};

export default function ProviderMessagesPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Fetch messages
  const fetchMessages = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/provider-messages");
      const json = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/sign-in");
          return;
        }
        setErrorMsg(json.error || "Failed to fetch messages");
      } else {
        setMessages(json.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setErrorMsg("Network error. Please try again.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/provider-messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messageId, 
          action: "mark_read" 
        }),
      });

      if (response.ok) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, read_at: new Date().toISOString() }
              : msg
          )
        );
      }
    } catch (error) {
      console.warn("Failed to mark message as read:", error);
    }
  };

  // Open message details
  const openMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read_at) {
      markAsRead(message.id);
    }
  };

  // Close message details
  const closeMessage = () => {
    setSelectedMessage(null);
  };

  // Filter messages
  const unreadMessages = messages.filter(msg => !msg.read_at && !msg.archived_at);
  const readMessages = messages.filter(msg => msg.read_at && !msg.archived_at);

  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderNavigationClient currentPage="dashboard" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quote Requests</h1>
              <p className="text-gray-600 mt-2">Manage incoming quote requests from homeowners</p>
            </div>
            <button
              onClick={fetchMessages}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 mb-6">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading messages...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Messages List */}
              <div className="space-y-6">
                {/* Unread Messages */}
                {unreadMessages.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-blue-600" />
                      New Messages ({unreadMessages.length})
                    </h2>
                    <div className="space-y-3">
                      {unreadMessages.map((message) => (
                        <div
                          key={message.id}
                          onClick={() => openMessage(message)}
                          className="bg-white border-l-4 border-blue-500 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1">
                                {message.subject}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center mb-2">
                                <User className="h-4 w-4 mr-1" />
                                {message.profiles?.full_name || "Anonymous"}
                              </p>
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {message.message}
                              </p>
                            </div>
                            <div className="ml-4 flex flex-col items-end">
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                New
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(message.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Read Messages */}
                {readMessages.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <MailOpen className="h-5 w-5 mr-2 text-gray-600" />
                      Previous Messages ({readMessages.length})
                    </h2>
                    <div className="space-y-3">
                      {readMessages.map((message) => (
                        <div
                          key={message.id}
                          onClick={() => openMessage(message)}
                          className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-700 mb-1">
                                {message.subject}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center mb-2">
                                <User className="h-4 w-4 mr-1" />
                                {message.profiles?.full_name || "Anonymous"}
                              </p>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {message.message}
                              </p>
                            </div>
                            <div className="ml-4 flex flex-col items-end">
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                Read
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(message.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Messages */}
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      When homeowners send you quote requests, they will appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* Message Details */}
              <div className="lg:sticky lg:top-8">
                {selectedMessage ? (
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {selectedMessage.subject}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 space-x-4">
                            <span className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {selectedMessage.profiles?.full_name || "Anonymous"}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(selectedMessage.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={closeMessage}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedMessage.message}
                        </p>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-4">
                          To respond to this quote request, contact the homeowner directly using their contact information.
                        </p>
                        <div className="flex space-x-3">
                          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                            Reply via Email
                          </button>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            Call Customer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Select a message</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Choose a message from the list to view its details.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div></div>
  );
} 