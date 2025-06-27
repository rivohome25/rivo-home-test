"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Reports = {
  daily_signups: Array<{ day: string; signup_count: number }>;
  active_subscribers: { active_count: number };
  user_home_counts: Array<{ user_id: string; home_count: number }>;
  user_tasks_completed: Array<{ user_id: string; tasks_completed: number }>;
  task_trends: Array<{ day: string; completed_count: number }>;
};

export default function AdminReportsPage() {
  const supabase = createClientComponentClient();
  const [reports, setReports] = useState<Reports | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/reports", {
        method: "GET",
        credentials: 'include'
      });
      
      if (!res.ok) {
        const json = await res.json();
        setErrorMsg(json.error || "Failed to fetch reports");
        setLoading(false);
        return;
      }
      
      const json = await res.json();
      setReports(json);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setErrorMsg("Failed to fetch reports");
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">{errorMsg}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Usage Reports & Analytics</h1>
        <p className="text-gray-600">System-wide metrics and user activity reports</p>
      </div>

      {reports && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Active Subscribers</h3>
              <p className="text-2xl font-bold text-blue-600">
                {reports.active_subscribers?.active_count || 0}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Total Users</h3>
              <p className="text-2xl font-bold text-green-600">
                {reports.user_home_counts?.length || 0}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Signups (7 days)</h3>
              <p className="text-2xl font-bold text-purple-600">
                {reports.daily_signups?.slice(0, 7).reduce((sum, day) => sum + day.signup_count, 0) || 0}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Task Completions (30 days)</h3>
              <p className="text-2xl font-bold text-orange-600">
                {reports.task_trends?.reduce((sum, day) => sum + day.completed_count, 0) || 0}
              </p>
            </div>
          </div>

          {/* Daily Signups Chart */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Daily Signups (Last 30 Days)</h3>
            {reports.daily_signups && reports.daily_signups.length > 0 ? (
              <div className="space-y-2">
                {reports.daily_signups.slice(0, 30).map((day, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {new Date(day.day).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="bg-blue-500 h-2 rounded"
                        style={{ width: `${Math.max(day.signup_count * 10, 4)}px` }}
                      ></div>
                      <span className="font-medium w-8 text-right">{day.signup_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No signup data available</p>
            )}
          </div>

          {/* Task Completion Trends */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Task Completion Trends (Last 30 Days)</h3>
            {reports.task_trends && reports.task_trends.length > 0 ? (
              <div className="space-y-2">
                {reports.task_trends.slice(0, 30).map((day, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {new Date(day.day).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="bg-green-500 h-2 rounded"
                        style={{ width: `${Math.max(day.completed_count * 2, 4)}px` }}
                      ></div>
                      <span className="font-medium w-8 text-right">{day.completed_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No task completion data available</p>
            )}
          </div>

          {/* Top Users by Homes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Top Users by Homes</h3>
              {reports.user_home_counts && reports.user_home_counts.length > 0 ? (
                <div className="space-y-2">
                  {reports.user_home_counts.slice(0, 10).map((user, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-mono text-xs">
                        {user.user_id.slice(0, 8)}...
                      </span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded"
                          style={{ width: `${Math.max(user.home_count * 20, 4)}px` }}
                        ></div>
                        <span className="font-medium w-8 text-right">{user.home_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No home data available</p>
              )}
            </div>

            {/* Top Users by Completed Tasks */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Top Users by Completed Tasks</h3>
              {reports.user_tasks_completed && reports.user_tasks_completed.length > 0 ? (
                <div className="space-y-2">
                  {reports.user_tasks_completed.slice(0, 10).map((user, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-mono text-xs">
                        {user.user_id.slice(0, 8)}...
                      </span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded"
                          style={{ width: `${Math.max(user.tasks_completed * 2, 4)}px` }}
                        ></div>
                        <span className="font-medium w-8 text-right">{user.tasks_completed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No task completion data available</p>
              )}
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-center">
            <button
              onClick={fetchReports}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Reports
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 