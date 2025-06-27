"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import BookingCalendar from "@/components/scheduling/BookingCalendar";
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs";

type Provider = {
  user_id: string;
  business_name: string;
  contact_name: string;
  services_offered: string[];
};

type Props = {
  provider: Provider;
  onClose: (booked: boolean) => void;
};

export default function ProviderBookingModal({ provider, onClose }: Props) {
  const supabase: SupabaseClient = createClientComponentClient();
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg max-h-[90vh] overflow-hidden relative">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Book an Appointment</h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <BookingCalendar
            providerId={provider.user_id}
            providerName={provider.business_name || provider.contact_name}
            services={provider.services_offered || []}
          />
        </div>
      </div>
    </div>
  );
} 