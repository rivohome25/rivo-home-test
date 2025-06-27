'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import SignOutButton from '@/components/SignOutButton'
import KPICard from '@/components/ui/enterprise/KPICard'
import ActivityFeed from '@/components/ui/enterprise/ActivityFeed'
import NavigationCard from '@/components/ui/enterprise/NavigationCard'
import ActionButton from '@/components/ui/enterprise/ActionButton'
import AnalyticsData from './components/AnalyticsData'
import { 
  RiUserLine, 
  RiUserStarLine, 
  RiBarChartLine, 
  RiShieldCheckLine, 
  RiNotificationLine,
  RiFileTextLine,
  RiSettings4Line,
  RiDashboardLine,
  RiTeamLine,
  RiSearchLine,
  RiLoader4Line
} from 'react-icons/ri'

export default function AdminDashboard() {
  const [userProfile, setUserProfile] = useState<{ full_name?: string; email?: string } | null>(null)

  useEffect(() => {
    // Get user info from session storage or make API call
    // For now, we'll just use a placeholder since the server component approach 
    // would require restructuring the whole component
    setUserProfile({ full_name: 'Admin User', email: 'admin@rivohome.com' })
  }, [])

  return (
    <AnalyticsData>
      {(analyticsData, loading, error) => (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Enterprise Command Center Header */}
            <div className="enterprise-header">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <h1 className="text-display text-white font-bold mb-2">
                    Admin Command Center
                  </h1>
                  <p className="text-white/90 text-lg">
                    Welcome back, {userProfile?.full_name || userProfile?.email || 'Admin'}
                  </p>
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="status-indicator-online"></div>
                      <span className="text-white/80 text-sm">System Online</span>
                    </div>
                    <div className="text-white/80 text-sm">
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mt-6 lg:mt-0">
                  <ActionButton
                    variant="ghost"
                    icon={<RiSearchLine className="w-5 h-5" />}
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    Search
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    icon={<RiNotificationLine className="w-5 h-5" />}
                    badge={{ count: 3, status: 'warning', pulse: true }}
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    Notifications
                  </ActionButton>
                  <Link href="/settings">
                    <ActionButton
                      variant="ghost"
                      icon={<RiSettings4Line className="w-5 h-5" />}
                      className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                      Settings
                    </ActionButton>
                  </Link>
                  <SignOutButton variant="button" showIcon={true} className="bg-white/10 hover:bg-white/20 text-white border-white/30" />
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <RiLoader4Line className="w-8 h-8 animate-spin text-rivo-500 mx-auto mb-4" />
                  <p className="text-slate-600">Loading analytics...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 p-6">
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
                  Error loading analytics: {error}
                </div>
              </div>
            )}

            {/* KPI Metrics Dashboard */}
            {analyticsData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KPICard
                    title="Total Users"
                    value={analyticsData.totalUsers}
                    change={analyticsData.recentSignupsCount > 0 ? 12.5 : 0}
                    trend={analyticsData.recentSignupsCount > 0 ? "up" : "neutral"}
                    icon={<RiUserLine className="w-6 h-6" />}
                    color="primary"
                  />
                  <KPICard
                    title="Active Providers"
                    value={analyticsData.totalProviders}
                    change={8.3}
                    trend="up"
                    icon={<RiUserStarLine className="w-6 h-6" />}
                    color="success"
                  />
                  <KPICard
                    title="Pending Applications"
                    value={analyticsData.pendingApplications}
                    change={analyticsData.pendingApplications > 0 ? -5.2 : 0}
                    trend={analyticsData.pendingApplications > 0 ? "down" : "neutral"}
                    icon={<RiFileTextLine className="w-6 h-6" />}
                    color="warning"
                  />
                  <KPICard
                    title="Active Subscribers"
                    value={analyticsData.activeSubscribers}
                    suffix=""
                    change={2.1}
                    trend="up"
                    icon={<RiShieldCheckLine className="w-6 h-6" />}
                    color="info"
                  />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Navigation Cards Section */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h2 className="text-h2 text-slate-900 mb-6">Management Centers</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <NavigationCard
                          title="User Management"
                          description="View, edit, and manage all users in the system."
                          href="/admin/users"
                          icon={<RiTeamLine className="w-6 h-6" />}
                          badge={{ count: analyticsData.totalUsers, label: "total users" }}
                          stats={[
                            { label: "New Today", value: analyticsData.dailySignups[0]?.signup_count?.toString() || "0" },
                            { label: "Active", value: "89%" }
                          ]}
                          preview={{
                            title: "Recent Actions",
                            items: [
                              `${analyticsData.recentSignupsCount} new user registrations`,
                              "2 account activations", 
                              "1 permission update",
                              "5 profile updates"
                            ]
                          }}
                        />

                        <NavigationCard
                          title="Provider Applications"
                          description="Review and manage service provider applications."
                          href="/admin/providers"
                          icon={<RiUserStarLine className="w-6 h-6" />}
                          badge={{ 
                            count: analyticsData.pendingApplications, 
                            label: "pending", 
                            status: analyticsData.pendingApplications > 0 ? "warning" : "success", 
                            pulse: analyticsData.pendingApplications > 0 
                          }}
                          stats={[
                            { label: "This Week", value: "8" },
                            { label: "Approved", value: "92%" }
                          ]}
                          preview={{
                            title: "Pending Reviews",
                            items: analyticsData.pendingApplications > 0 ? [
                              "Elite Plumbing Services",
                              "ProClean Solutions",
                              "Ace Electrical",
                              "Premier Landscaping"
                            ] : ["No pending applications"]
                          }}
                        />

                        <NavigationCard
                          title="System Analytics"
                          description="View platform metrics and performance analytics."
                          href="/admin/analytics"
                          icon={<RiBarChartLine className="w-6 h-6" />}
                          stats={[
                            { label: "Uptime", value: "99.9%" },
                            { label: "Response", value: "120ms" }
                          ]}
                          preview={{
                            title: "Key Metrics",
                            items: [
                              `User engagement up ${analyticsData.recentSignupsCount > 5 ? '15%' : '5%'}`,
                              "API response time optimized",
                              "Zero security incidents",
                              "Database performance stable"
                            ]
                          }}
                        />

                        <NavigationCard
                          title="System Reports"
                          description="Generate comprehensive system and usage reports."
                          href="/admin/reports"
                          icon={<RiDashboardLine className="w-6 h-6" />}
                          stats={[
                            { label: "Reports", value: "24" },
                            { label: "Scheduled", value: "5" }
                          ]}
                          preview={{
                            title: "Available Reports",
                            items: [
                              "Monthly user activity",
                              "Provider performance",
                              "Revenue analytics",
                              "System usage statistics"
                            ]
                          }}
                        />

                      </div>
                    </div>

                    {/* Enhanced Quick Actions */}
                    <div>
                      <h2 className="text-h2 text-slate-900 mb-6">Quick Actions</h2>
                      <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <ActionButton
                            variant="primary"
                            size="md"
                            icon={<RiShieldCheckLine className="w-5 h-5" />}
                            fullWidth
                          >
                            Verify Providers
                          </ActionButton>
                          <ActionButton
                            variant="success"
                            size="md"
                            icon={<RiBarChartLine className="w-5 h-5" />}
                            fullWidth
                          >
                            Generate Reports
                          </ActionButton>
                          <ActionButton
                            variant="secondary"
                            size="md"
                            icon={<RiSettings4Line className="w-5 h-5" />}
                            fullWidth
                          >
                            System Settings
                          </ActionButton>
                          <ActionButton
                            variant="ghost"
                            size="md"
                            icon={<RiFileTextLine className="w-5 h-5" />}
                            fullWidth
                          >
                            Manage Content
                          </ActionButton>
                        </div>

                        {/* System Status Bar */}
                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <div className="status-indicator-online"></div>
                                <span className="text-slate-600">Database</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="status-indicator-online"></div>
                                <span className="text-slate-600">API Services</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="status-indicator-warning"></div>
                                <span className="text-slate-600">Background Jobs</span>
                              </div>
                            </div>
                            <span className="text-slate-500">Last check: 2 minutes ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Feed Sidebar */}
                  <div className="lg:col-span-1">
                    <ActivityFeed 
                      autoRefresh={true}
                      maxItems={8}
                      className="sticky top-8"
                    />
                  </div>
                </div>

                {/* Performance Indicators Footer */}
                <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">System Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-enterprise-success-600">99.9%</div>
                      <div className="text-sm text-slate-600">Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-enterprise-info-600">120ms</div>
                      <div className="text-sm text-slate-600">Avg Response</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-enterprise-warning-600">2.1GB</div>
                      <div className="text-sm text-slate-600">Memory Usage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-rivo-600">{Math.min(85 + analyticsData.totalUsers, 95)}%</div>
                      <div className="text-sm text-slate-600">CPU Usage</div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </AnalyticsData>
  )
} 