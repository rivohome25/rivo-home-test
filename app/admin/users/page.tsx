"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import KPICard from '@/components/ui/enterprise/KPICard';
import ActionButton from '@/components/ui/enterprise/ActionButton';
import { 
  RiUserLine, 
  RiUserStarLine, 
  RiUserSettingsLine,
  RiShieldUserLine,
  RiMoneyDollarCircleLine,
  RiEyeLine,
  RiEditLine,
  RiLoader4Line,
  RiSearchLine,
  RiFilterLine,
  RiDownloadLine
} from 'react-icons/ri';

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  signup_date: string;
  is_suspended: boolean;
  plan: string;
  plan_price: number;
  plan_status: string;
  plan_started: string;
  canceled_at: string | null;
  balance: number;
};

type Plan = {
  id: number;
  name: string;
  price: number;
};

export default function AdminUsersPage() {
  const supabase = createClientComponentClient();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    try {
      // Get admin secret from environment
      const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET;
      
      const res = await fetch("/api/admin/users", {
        method: "GET",
        credentials: 'include',
        headers: {
          "x-admin-secret": adminSecret || ""
        }
      });
      
      if (!res.ok) {
        const json = await res.json();
        setErrorMsg(json.error || "Failed to fetch users");
        setLoading(false);
        return;
      }
      
      const json = await res.json();
      setUsers(json.users || []);
      setFilteredUsers(json.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMsg("Failed to fetch users");
    }
    
    setLoading(false);
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("id, name, price")
        .order("price", { ascending: true });
        
      if (error) {
        console.error("Error fetching plans:", error);
      } else {
        setPlans(data || []);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => !user.is_suspended);
      } else if (statusFilter === 'suspended') {
        filtered = filtered.filter(user => user.is_suspended);
      }
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Calculate KPIs
  const kpiData = {
    totalUsers: users.length,
    activeUsers: users.filter(u => !u.is_suspended).length,
    suspendedUsers: users.filter(u => u.is_suspended).length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    providerUsers: users.filter(u => u.role === 'provider').length,
    homeownerUsers: users.filter(u => u.role === 'homeowner').length,
    premiumUsers: users.filter(u => u.plan !== 'Free').length,
    totalRevenue: users.reduce((sum, u) => sum + u.plan_price, 0)
  };

  // Handler: suspend/reactivate
  const toggleSuspend = async (userId: string, shouldSuspend: boolean) => {
    setActionLoading(userId);
    
    try {
      // Get admin secret from environment
      const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET;
      
      const res = await fetch(`/api/admin/users/${userId}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret || ""
        },
        credentials: 'include',
        body: JSON.stringify({ action: shouldSuspend ? "suspend" : "reactivate" }),
      });
      
      if (!res.ok) {
        const json = await res.json();
        alert(json.error || "Failed to toggle suspension");
      } else {
        const json = await res.json();
        alert(json.message || "User updated successfully");
        fetchUsers();
      }
    } catch (error) {
      console.error("Error toggling suspension:", error);
      alert("Failed to update user");
    }
    
    setActionLoading(null);
  };

  // Handler: change plan
  const changePlan = async (userId: string, planId: number) => {
    setActionLoading(userId);
    
    try {
      // Get admin secret from environment
      const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET;
      
      const res = await fetch(`/api/admin/users/${userId}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret || ""
        },
        credentials: 'include',
        body: JSON.stringify({ action: "change_plan", plan_id: planId }),
      });
      
      if (!res.ok) {
        const json = await res.json();
        alert(json.error || "Failed to change plan");
      } else {
        const json = await res.json();
        alert(json.message || "Plan changed successfully");
        fetchUsers();
      }
    } catch (error) {
      console.error("Error changing plan:", error);
      alert("Failed to change plan");
    }
    
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Enterprise Header */}
        <div className="enterprise-header">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-display text-white font-bold mb-2">
                User Management
              </h1>
              <p className="text-white/90 text-lg">
                Manage user accounts, subscriptions, and balances
              </p>
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="status-indicator-online"></div>
                  <span className="text-white/80 text-sm">Real-time Data</span>
                </div>
                <div className="text-white/80 text-sm">
                  Total users: {users.length}
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
              <ActionButton
                icon={<RiDownloadLine className="w-5 h-5" />}
                variant="secondary"
                size="md"
              >
                Export CSV
              </ActionButton>
              <ActionButton
                icon={<RiUserLine className="w-5 h-5" />}
                variant="primary"
                size="md"
              >
                Add User
              </ActionButton>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Users"
            value={kpiData.totalUsers}
            icon={<RiUserLine className="w-6 h-6" />}
            color="primary"
          />
          <KPICard
            title="Active Users"
            value={kpiData.activeUsers}
            icon={<RiShieldUserLine className="w-6 h-6" />}
            color="success"
          />
          <KPICard
            title="Premium Users"
            value={kpiData.premiumUsers}
            icon={<RiUserStarLine className="w-6 h-6" />}
            color="warning"
          />
          <KPICard
            title="Monthly Revenue"
            value={kpiData.totalRevenue}
            prefix="$"
            icon={<RiMoneyDollarCircleLine className="w-6 h-6" />}
            color="info"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 relative">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rivo-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <RiFilterLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-9 pr-8 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rivo-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="provider">Provider</option>
                  <option value="homeowner">Homeowner</option>
                </select>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rivo-500 focus:border-transparent transition-all appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="text-sm text-slate-600">
              Showing {filteredUsers.length} of {users.length} users
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Active: {kpiData.activeUsers}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Suspended: {kpiData.suspendedUsers}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <RiLoader4Line className="w-8 h-8 animate-spin text-rivo-500 mx-auto mb-4" />
                <p className="text-slate-600">Loading users...</p>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="p-6">
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">{errorMsg}</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Signup Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Plan</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-rivo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-rivo-700">
                                {(user.full_name || user.email)?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{user.full_name || 'No name'}</div>
                              <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'provider' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {user.signup_date 
                            ? new Date(user.signup_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Invalid Date'
                          }
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.plan}
                            onChange={(e) => {
                              const selectedPlan = plans.find(p => p.name === e.target.value);
                              if (selectedPlan && selectedPlan.name !== user.plan) {
                                changePlan(user.id, selectedPlan.id);
                              }
                            }}
                            disabled={actionLoading === user.id}
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-rivo-500 focus:border-transparent transition-all"
                          >
                            {plans.map(plan => (
                              <option key={plan.id} value={plan.name}>
                                {plan.name} (${plan.price})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            user.is_suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.is_suspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              className="inline-flex items-center px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-rivo-500 focus:border-transparent transition-all"
                            >
                              <RiEyeLine className="w-3 h-3 mr-1" />
                              View
                            </button>
                            
                            {user.is_suspended ? (
                              <button
                                onClick={() => toggleSuspend(user.id, false)}
                                disabled={actionLoading === user.id}
                                className="inline-flex items-center px-3 py-1.5 border border-green-200 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === user.id ? (
                                  <RiLoader4Line className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <RiShieldUserLine className="w-3 h-3 mr-1" />
                                )}
                                Reactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleSuspend(user.id, true)}
                                disabled={actionLoading === user.id}
                                className="inline-flex items-center px-3 py-1.5 border border-red-200 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === user.id ? (
                                  <RiLoader4Line className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <RiUserSettingsLine className="w-3 h-3 mr-1" />
                                )}
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-16">
                  <RiUserLine className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No users found</h3>
                  <p className="text-slate-500">
                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'No users have been created yet'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Role Distribution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Admins</h3>
              <RiShieldUserLine className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">{kpiData.adminUsers}</div>
            <p className="text-sm text-slate-600">System administrators</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Providers</h3>
              <RiUserStarLine className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{kpiData.providerUsers}</div>
            <p className="text-sm text-slate-600">Service providers</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Homeowners</h3>
              <RiUserLine className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">{kpiData.homeownerUsers}</div>
            <p className="text-sm text-slate-600">Property owners</p>
          </div>
        </div>
      </div>
    </div>
  );
} 