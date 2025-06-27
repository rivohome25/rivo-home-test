"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Provider = {
  user_id: string;
  business_name: string;
  zip_code: string;
  contact_name: string;
  contact_email: string;
  phone: string;
  bio: string;
  logo_url: string;
  services_offered: string[];
  service_radius: number[];
  created_at: string;
};

type Props = {
  provider: Provider;
  onClose: (sent: boolean) => void;
};

export default function RequestQuoteModal({ provider, onClose }: Props) {
  const [subject, setSubject] = useState<string>(`Quote request for ${provider.business_name}`);
  const [message, setMessage] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Send the message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      setErrorMsg("Subject and message are required.");
      return;
    }

    setSending(true);
    setErrorMsg(null);

    const payload = {
      provider_id: provider.user_id,
      subject,
      message,
    };

    try {
      const response = await fetch("/api/provider-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const json = await response.json();
      
      if (!response.ok) {
        console.error("Error sending message:", json.error);
        setErrorMsg(json.error || "Failed to send message");
        setSending(false);
        return;
      }

      // Success
      onClose(true);
    } catch (error) {
      console.error("Network error:", error);
      setErrorMsg("Network error. Please try again.");
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Request a Quote</h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Provider Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {provider.logo_url && (
              <img
                src={provider.logo_url}
                alt={`${provider.business_name} logo`}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <p className="font-medium text-gray-900">{provider.business_name}</p>
              <p className="text-sm text-gray-600">Contact: {provider.contact_name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {provider.services_offered.slice(0, 3).map((service, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {service}
                  </span>
                ))}
                {provider.services_offered.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{provider.services_offered.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="p-6 space-y-6">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Subject *
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of your project"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message *
            </label>
            <textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please describe your project, timeline, and any specific requirements..."
              required
            />
            <p className="text-xs text-gray-500">
              Include details about your project, timeline, and any specific requirements.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={sending || !subject || !message}
            >
              {sending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send Request"
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <p className="text-xs text-gray-500">
            Your request will be sent directly to {provider.business_name}. They will receive an email notification and can respond to you directly.
          </p>
        </div>
      </div>
    </div>
  );
} 