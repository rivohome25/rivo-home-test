"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import HomeownerNavigationClient from "@/components/HomeownerNavigationClient";
import RequestQuoteModal from "@/components/RequestQuoteModal";
import ProviderBookingModal from "@/components/ProviderBookingModal";
import { getUserPlan } from '@/lib/getUserPlan';
import { Lock, Crown } from 'lucide-react';
import Link from 'next/link';

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

type ServiceOption = {
  id: number;
  name: string;
};

export default function FindProvidersPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Plan access state
  const [userPlan, setUserPlan] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [planLoading, setPlanLoading] = useState<boolean>(true);

  // Search form state
  const [zip, setZip] = useState<string>("");
  const [serviceType, setServiceType] = useState<string>("");
  const [servicesOptions, setServicesOptions] = useState<ServiceOption[]>([]);

  // Search results state
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searched, setSearched] = useState<boolean>(false);

  // Modal state for Request Quote
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  // Modal state for Booking
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [chosenProvider, setChosenProvider] = useState<Provider | null>(null);

  // Fetch service options for the dropdown
  const fetchServiceOptions = async () => {
    const { data, error } = await supabase
      .from("provider_services_master")
      .select("id, name")
      .order("name");
    
    if (error) {
      console.error("Error fetching services:", error);
    } else if (data) {
      setServicesOptions(data);
    }
  };

  useEffect(() => {
    fetchServiceOptions();
  }, []);

  // Check user plan access
  useEffect(() => {
    async function checkPlanAccess() {
      try {
        const plan = await getUserPlan();
        setUserPlan(plan);
        // Free users (plan.name === 'Free') cannot access provider search
        setHasAccess(plan && plan.name !== 'Free');
      } catch (error) {
        console.error('Error checking plan access:', error);
        setHasAccess(false);
      } finally {
        setPlanLoading(false);
      }
    }
    
    checkPlanAccess();
  }, []);

  // Handle search form submit
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setProviders([]);
    setSearched(true);

    if (!zip.trim() || !serviceType) {
      setErrorMsg("Please enter a ZIP code and select a service type.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/providers?zip=${encodeURIComponent(zip.trim())}&service_type=${encodeURIComponent(serviceType)}`);
      const json = await response.json();
      
      if (!response.ok) {
        console.error("Search error:", json.error);
        setErrorMsg(json.error || "Failed to search providers");
      } else {
        setProviders(json.providers as Provider[]);
        if ((json.providers as Provider[]).length === 0) {
          setErrorMsg(`No providers found for ${serviceType} services in ${zip}.`);
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      setErrorMsg("Network error. Please try again.");
    }

    setLoading(false);
  };

  // Handle browse all providers
  const handleBrowseAll = async () => {
    setLoading(true);
    setErrorMsg(null);
    setProviders([]);
    setSearched(true);

    try {
      const response = await fetch('/api/providers');
      const json = await response.json();
      
      if (!response.ok) {
        console.error("Browse error:", json.error);
        setErrorMsg(json.error || "Failed to load providers");
      } else {
        setProviders(json.providers as Provider[]);
        if ((json.providers as Provider[]).length === 0) {
          setErrorMsg("No providers available at this time.");
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      setErrorMsg("Network error. Please try again.");
    }

    setLoading(false);
  };

  // Open "Request Quote" modal
  const openModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowModal(true);
  };

  // Close modal & optionally show success message
  const closeModal = (sent: boolean) => {
    setShowModal(false);
    setSelectedProvider(null);
    if (sent) {
      alert("Your quote request has been sent successfully!");
    }
  };

  // Open "Book Now" modal
  const openBookingModal = (provider: Provider) => {
    setChosenProvider(provider);
    setShowBookingModal(true);
  };

  // Close booking modal & optionally show success message
  const closeBookingModal = (booked: boolean) => {
    setShowBookingModal(false);
    setChosenProvider(null);
    if (booked) {
      alert("Your appointment request has been sent!");
    }
  };

  // Show loading state while checking plan
  if (planLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeownerNavigationClient 
          title="Find Service Providers"
          currentPage="find-providers" 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  // Show upgrade prompt for Free users
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeownerNavigationClient 
          title="Find Service Providers"
          currentPage="find-providers" 
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 border">
              <div className="text-center">
                <Lock className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Upgrade to Search Providers
                </h2>
                <p className="text-gray-600 mb-6">
                  Provider search and messaging is available for Core and Premium plan users. 
                  Upgrade to connect with trusted service providers in your area.
                </p>
                
                {/* Plan comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">Core Plan</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-2">$7/month</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Provider search & messaging</li>
                      <li>• Up to 3 home profiles</li>
                      <li>• Unlimited reminders</li>
                      <li>• 50 document storage</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4 border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-1 mb-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      <h3 className="font-semibold text-lg">Premium Plan</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mb-2">$20/month</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Everything in Core, plus:</li>
                      <li>• Direct provider booking</li>
                      <li>• Unlimited homes & documents</li>
                      <li>• Priority support</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Link href="/pricing" className="inline-block w-full">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors">
                      View Pricing Plans
                    </button>
                  </Link>
                  <p className="text-sm text-gray-500">
                    Questions? <Link href="/dashboard/support" className="text-blue-600 hover:underline">Contact Support</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeownerNavigationClient 
        title="Find Service Providers"
        currentPage="find-providers" 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">Find Service Providers</h2>
                {userPlan && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {userPlan.name === 'Premium' && <Crown className="w-3 h-3" />}
                    {userPlan.name} Plan
                  </div>
                )}
              </div>
              <p className="text-gray-600">Search for trusted service providers in your area</p>
            </div>
            
            <button
              type="button"
              onClick={handleBrowseAll}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Loading...' : 'Browse All Providers'}
            </button>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSearch} className="space-y-6">
            {errorMsg && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ZIP input */}
              <div className="space-y-2">
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                  ZIP Code *
                </label>
                <input
                  id="zip"
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="e.g. 98101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rivo-base focus:border-rivo-base"
                  required
                />
              </div>

              {/* Service dropdown */}
              <div className="space-y-2">
                <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
                  Service Type *
                </label>
                <select
                  id="serviceType"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rivo-base focus:border-rivo-base"
                  required
                >
                  <option value="">Select a service</option>
                  {servicesOptions.map((opt) => (
                    <option key={opt.id} value={opt.name}>
                      {opt.name.charAt(0).toUpperCase() + opt.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search button */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">&nbsp;</label>
                <button
                  type="submit"
                  disabled={loading}
                  className="rivo-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Search Providers'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {searched && (
          <div className="space-y-6">
            {providers.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Found {providers.length} provider{providers.length !== 1 ? 's' : ''}
                </h3>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {providers.map((provider) => (
                    <div key={provider.user_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {provider.business_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {provider.contact_name}
                          </p>
                        </div>
                        {provider.logo_url && (
                          <img
                            src={provider.logo_url}
                            alt={`${provider.business_name} logo`}
                            className="h-12 w-12 rounded object-cover"
                          />
                        )}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm">
                          <span className="font-medium">Location:</span> {provider.zip_code}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Email:</span> {provider.contact_email}
                        </p>
                        {provider.phone && (
                          <p className="text-sm">
                            <span className="font-medium">Phone:</span> {provider.phone}
                          </p>
                        )}
                      </div>
                      
                      {provider.bio && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {provider.bio}
                        </p>
                      )}
                      
                      {provider.services_offered && provider.services_offered.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                          <div className="flex flex-wrap gap-1">
                            {provider.services_offered.slice(0, 3).map((service) => (
                              <span
                                key={service}
                                className="inline-block bg-rivo-light bg-opacity-20 text-rivo-dark text-xs px-2 py-1 rounded"
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
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(provider)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors text-center text-sm"
                        >
                          Request Quote
                        </button>
                        <button
                          onClick={() => openBookingModal(provider)}
                          className="flex-1 rivo-button text-center text-sm"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Request Quote Modal */}
        {showModal && selectedProvider && (
          <RequestQuoteModal
            provider={selectedProvider}
            onClose={closeModal}
          />
        )}

        {/* Booking Modal */}
        {showBookingModal && chosenProvider && (
          <ProviderBookingModal
            provider={chosenProvider}
            onClose={closeBookingModal}
          />
        )}
      </div></div>
  );
} 