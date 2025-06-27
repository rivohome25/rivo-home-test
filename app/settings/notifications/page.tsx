"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Mail, Calendar } from "lucide-react";
import HomeownerNavigationClient from "@/components/HomeownerNavigationClient";
import SettingsNavigation from "@/components/SettingsNavigation";

export default function NotificationSettingsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [optIn7Day, setOptIn7Day] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role and current settings
  const fetchSettings = async () => {
    setLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/sign-in');
        return;
      }

      // Get user profile with settings
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, opt_in_7day_reminders")
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        toast.error("Failed to load notification settings");
      } else if (profile) {
        setUserRole(profile.role);
        setOptIn7Day(profile.opt_in_7day_reminders || false);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while loading settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle toggle
  const handleToggle = async () => {
    setSaving(true);
    const newValue = !optIn7Day;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ opt_in_7day_reminders: newValue })
        .eq('id', user.id);

      if (error) {
        console.error("Error updating setting:", error);
        toast.error("Failed to update notification settings");
      } else {
        setOptIn7Day(newValue);
        toast.success(newValue 
          ? "7-day reminders enabled successfully" 
          : "7-day reminders disabled successfully"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while saving settings");
    } finally {
      setSaving(false);
    }
  };

  // Loading state with consistent structure
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeownerNavigationClient 
          title="Settings" 
          currentPage="settings"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-2xl mx-auto">
            <SettingsNavigation userRole="homeowner" />
            <div className="bg-white shadow rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show for homeowners
  if (userRole !== 'homeowner') {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeownerNavigationClient 
        title="Settings" 
        currentPage="settings"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-2xl mx-auto">
          <SettingsNavigation userRole="homeowner" />
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="h-8 w-8 text-blue-600" />
              Notification Settings
            </h1>
            <p className="mt-2 text-gray-600">
              Manage how and when you receive maintenance reminders
            </p>
          </div>

          {/* Email Notifications Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-600" />
                Email Notifications
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Configure your email reminder preferences
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* 1-Day Reminder (Always On) */}
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="h-5 w-5 text-blue-600 rounded cursor-not-allowed opacity-75 mt-0.5"
                />
                <div className="flex-1">
                  <label className="text-lg font-medium text-gray-900">
                    Day-Before Reminders
                  </label>
                  <p className="mt-1 text-sm text-gray-600">
                    You'll always receive an email reminder one day before each maintenance task is due. 
                    This ensures you never miss important home maintenance.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Always enabled for all users</span>
                  </div>
                </div>
              </div>

              {/* 7-Day Reminder (Optional) */}
              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  id="optIn7Day"
                  type="checkbox"
                  checked={optIn7Day}
                  onChange={handleToggle}
                  disabled={saving}
                  className="h-5 w-5 text-blue-600 rounded cursor-pointer mt-0.5 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <label 
                    htmlFor="optIn7Day" 
                    className="text-lg font-medium text-gray-900 cursor-pointer"
                  >
                    7-Day Advance Reminders
                  </label>
                  <p className="mt-1 text-sm text-gray-600">
                    Get an early heads-up email exactly <strong>7 days</strong> before each maintenance task is due. 
                    Perfect for planning ahead and scheduling service providers.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                    <Calendar className="h-3 w-3" />
                    <span>Core & Premium feature</span>
                  </div>
                </div>
              </div>

              {saving && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Saving changes...
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900">
              About Email Reminders
            </h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li>• All reminders are sent to your registered email address</li>
              <li>• Reminders include task details and property information</li>
              <li>• You can view all upcoming tasks anytime in My Schedule</li>
              <li>• Email reminders help you stay on top of home maintenance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 