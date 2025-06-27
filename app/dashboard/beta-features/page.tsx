"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import HomeownerNavigationClient from "@/components/HomeownerNavigationClient";

interface FeatureFlag {
  name: string;
  description: string;
  beta_only: boolean;
  enabled: boolean;
}

interface UserPlan {
  max_homes: number | null;
  plan_name: string;
}

export default function BetaFeaturesPage() {
  const supabase = createClientComponentClient();
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
    fetchUserPlan();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await fetch("/api/feature-flags");
      const data = await response.json();
      
      if (response.ok) {
        setFeatures(data.features || []);
      } else {
        console.error("Error fetching features:", data.error);
      }
    } catch (error) {
      console.error("Error fetching features:", error);
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

  const getFeatureIcon = (featureName: string) => {
    switch (featureName) {
      case 'advanced_analytics':
        return (
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'ai_maintenance_suggestions':
        return (
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'virtual_property_tours':
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'smart_home_integration':
        return (
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        );
      case 'automated_reporting':
        return (
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const formatFeatureName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeownerNavigationClient title="Beta Features" currentPage="dashboard" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading beta features...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeownerNavigationClient title="Beta Features" currentPage="dashboard" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Beta Features Lab</h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Get early access to cutting-edge features before they're released to everyone. 
                Help shape the future of RivoHome with exclusive Premium beta features.
              </p>
            </div>
          </div>
        </div>

        {/* Premium Status Banner */}
        {isPremium ? (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center justify-center">
                <svg className="h-8 w-8 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-yellow-800">Premium Beta Access Active</h2>
                  <p className="text-yellow-700">
                    You have exclusive access to all beta features as a Premium subscriber.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-blue-900 mb-2">Unlock Beta Features</h2>
                <p className="text-blue-700 mb-4">
                  Upgrade to Premium to get early access to experimental features and help shape the future of RivoHome.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isPremium && features.length > 0 ? (
            features.map((feature) => (
              <div key={feature.name} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getFeatureIcon(feature.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatFeatureName(feature.name)}
                        </h3>
                        {feature.beta_only && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Beta
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        {feature.description}
                      </p>
                      <button className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md transition-colors text-sm">
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : !isPremium ? (
            // Show locked features for non-Premium users
            [
              { name: 'advanced_analytics', description: 'Advanced property analytics and insights dashboard' },
              { name: 'ai_maintenance_suggestions', description: 'AI-powered maintenance task suggestions based on property data' },
              { name: 'virtual_property_tours', description: 'Create and share virtual property tours' },
              { name: 'smart_home_integration', description: 'Connect with smart home devices and IoT sensors' },
              { name: 'automated_reporting', description: 'Automated property report generation and scheduling' }
            ].map((feature) => (
              <div key={feature.name} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden opacity-75">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 opacity-50">
                      {getFeatureIcon(feature.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatFeatureName(feature.name)}
                        </h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Beta
                        </span>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        {feature.description}
                      </p>
                      <button className="w-full bg-gray-200 text-gray-500 px-4 py-2 rounded-md text-sm cursor-not-allowed">
                        Premium Required
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Beta Features Available</h3>
              <p className="mt-2 text-gray-600">
                Check back soon for new experimental features to try out!
              </p>
            </div>
          )}
        </div>

        {/* Feature Request Section */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Have a Feature Idea?</h2>
              <p className="text-gray-600 mb-6">
                As a Premium subscriber, your feedback directly influences our product roadmap. 
                Share your ideas for new features you'd like to see in beta.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Submit Feature Request
              </button>
            </div>
          </div>
        </div>
      </div></div>
  );
} 