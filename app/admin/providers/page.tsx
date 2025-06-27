'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import KPICard from '@/components/ui/enterprise/KPICard';
import ActionButton from '@/components/ui/enterprise/ActionButton';
import { 
  RiUserStarLine, 
  RiFileTextLine, 
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiTimeLine,
  RiSearchLine,
  RiFilterLine,
  RiDownloadLine,
  RiEyeLine,
  RiLoader4Line,
  RiShieldCheckLine,
  RiBuildingLine,
  RiImageLine,
  RiLinksLine,
  RiMapPinLine,
  RiPhoneLine,
  RiMailLine,
  RiCalendarLine,
  RiStarLine,
  RiExternalLinkLine
} from 'react-icons/ri';

type App = {
  user_id: string
  full_name: string
  business_name: string
  email: string
  phone: string
  zip_code: string
  bio: string
  logo_url: string
  portfolio: string[]
  social_links: string[]
  background_check_consent: boolean
  created_at: string
  license_url: string
  insurance_url: string
  external_reviews: {
    platform: string
    url: string
    testimonial: string | null
  }[]
}

export default function AdminProvidersPage() {
  const [apps, setApps] = useState<App[]>([])
  const [filteredApps, setFilteredApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [sortBy, setSortBy] = useState<string>('newest')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/providers', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error)
        else {
          setApps(data)
          setFilteredApps(data)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Filter and sort applications
  useEffect(() => {
    let filtered = apps;

    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort applications
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.full_name.localeCompare(b.full_name);
        case 'business':
          return a.business_name.localeCompare(b.business_name);
        default:
          return 0;
      }
    });

    setFilteredApps(filtered);
  }, [apps, searchTerm, sortBy]);

  // Calculate KPIs
  const kpiData = {
    totalApplications: apps.length,
    withDocuments: apps.filter(a => a.license_url || a.insurance_url).length,
    withPortfolio: apps.filter(a => a.portfolio && a.portfolio.length > 0).length,
    withReviews: apps.filter(a => a.external_reviews && a.external_reviews.length > 0).length,
    avgResponseTime: '2.5',
    approvalRate: 85
  };

  const updateStatus = async (userId: string, status: 'approved' | 'rejected') => {
    setActionLoading(userId);
    
    try {
      const response = await fetch(`/api/admin/providers/${userId}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }
      
      // Remove from list
      setApps(apps.filter(a => a.user_id !== userId))
      setFilteredApps(filteredApps.filter(a => a.user_id !== userId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating application');
    }
    
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <RiLoader4Line className="w-8 h-8 animate-spin text-rivo-500 mx-auto mb-4" />
              <p className="text-slate-600">Loading applications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 p-6">
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
              Error: {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Enterprise Header */}
        <div className="enterprise-header">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-display text-white font-bold mb-2">
                Provider Applications
              </h1>
              <p className="text-white/90 text-lg">
                Review and manage service provider applications
              </p>
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="status-indicator-online"></div>
                  <span className="text-white/80 text-sm">Real-time Updates</span>
                </div>
                <div className="text-white/80 text-sm">
                  {apps.length} pending applications
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
              <ActionButton
                icon={<RiDownloadLine className="w-5 h-5" />}
                variant="secondary"
                size="md"
              >
                Export List
              </ActionButton>
              <ActionButton
                icon={<RiUserStarLine className="w-5 h-5" />}
                variant="primary"
                size="md"
              >
                Bulk Actions
              </ActionButton>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Applications"
            value={kpiData.totalApplications}
            icon={<RiFileTextLine className="w-6 h-6" />}
            color="primary"
          />
          <KPICard
            title="With Documents"
            value={kpiData.withDocuments}
            icon={<RiShieldCheckLine className="w-6 h-6" />}
            color="success"
          />
          <KPICard
            title="With Portfolio"
            value={kpiData.withPortfolio}
            icon={<RiImageLine className="w-6 h-6" />}
            color="warning"
          />
          <KPICard
            title="Approval Rate"
            value={kpiData.approvalRate}
            suffix="%"
            icon={<RiCheckboxCircleLine className="w-6 h-6" />}
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
                placeholder="Search by name, business, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rivo-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <RiFilterLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-9 pr-8 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rivo-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">By Name</option>
                  <option value="business">By Business</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="text-sm text-slate-600">
              Showing {filteredApps.length} of {apps.length} applications
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Documents: {kpiData.withDocuments}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Portfolio: {kpiData.withPortfolio}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 p-16">
            <div className="text-center">
              <RiFileTextLine className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No applications found</h3>
              <p className="text-slate-500">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'No pending provider applications at this time'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApps.map(app => (
              <div key={app.user_id} className="bg-white rounded-2xl shadow-enterprise border border-slate-100 overflow-hidden hover:shadow-enterprise-lg transition-all duration-300">
                
                {/* Application Header */}
                <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-b border-slate-100">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-xl bg-rivo-100 flex items-center justify-center overflow-hidden">
                        {app.logo_url ? (
                          <img src={app.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <RiBuildingLine className="w-8 h-8 text-rivo-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900">{app.full_name}</h2>
                        <h3 className="text-lg text-rivo-600 font-medium">{app.business_name}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                          <div className="flex items-center space-x-1">
                            <RiCalendarLine className="w-4 h-4" />
                            <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RiMapPinLine className="w-4 h-4" />
                            <span>{app.zip_code}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {app.license_url && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <RiShieldCheckLine className="w-3 h-3 mr-1" />
                          Licensed
                        </span>
                      )}
                      {app.insurance_url && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <RiShieldCheckLine className="w-3 h-3 mr-1" />
                          Insured
                        </span>
                      )}
                      {app.background_check_consent && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <RiCheckboxCircleLine className="w-3 h-3 mr-1" />
                          Background Check
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Application Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-900 flex items-center">
                        <RiUserStarLine className="w-5 h-5 mr-2 text-rivo-600" />
                        Contact Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <RiMailLine className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{app.email}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RiPhoneLine className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{app.phone}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <RiMapPinLine className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">Zip Code: {app.zip_code}</span>
                        </div>
                      </div>
                      
                      {app.bio && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-slate-900 mb-2">Bio</h5>
                          <p className="text-sm text-slate-600 leading-relaxed">{app.bio}</p>
                        </div>
                      )}
                    </div>

                    {/* Documents & Portfolio */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-slate-900 flex items-center">
                        <RiFileTextLine className="w-5 h-5 mr-2 text-rivo-600" />
                        Documents & Portfolio
                      </h4>
                      
                      <div className="space-y-3">
                        {app.license_url && (
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-sm font-medium text-green-800">License Document</span>
                            <a 
                              href={app.license_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              <RiEyeLine className="w-3 h-3 mr-1" />
                              View
                            </a>
                          </div>
                        )}
                        
                        {app.insurance_url && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-sm font-medium text-blue-800">Insurance Document</span>
                            <a 
                              href={app.insurance_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <RiEyeLine className="w-3 h-3 mr-1" />
                              View
                            </a>
                          </div>
                        )}
                        
                        {app.portfolio && app.portfolio.length > 0 && (
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-800">Portfolio ({app.portfolio.length} items)</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {app.portfolio.slice(0, 3).map((url, i) => (
                                <a 
                                  key={i}
                                  href={url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-600 bg-white rounded border hover:bg-slate-50 transition-colors"
                                >
                                  <RiImageLine className="w-3 h-3 mr-1" />
                                  Item {i+1}
                                </a>
                              ))}
                              {app.portfolio.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 text-xs text-slate-500">
                                  +{app.portfolio.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* External Reviews */}
                  {app.external_reviews && app.external_reviews.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <h4 className="text-lg font-semibold text-slate-900 flex items-center mb-4">
                        <RiStarLine className="w-5 h-5 mr-2 text-rivo-600" />
                        External Reviews ({app.external_reviews.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {app.external_reviews.map((review, i) => (
                          <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-900">{review.platform}</span>
                              <a 
                                href={review.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center text-xs text-rivo-600 hover:text-rivo-700"
                              >
                                <RiExternalLinkLine className="w-3 h-3 mr-1" />
                                View
                              </a>
                            </div>
                            {review.testimonial && (
                              <p className="text-sm text-slate-600 italic">"{review.testimonial}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => updateStatus(app.user_id, 'approved')}
                        disabled={actionLoading === app.user_id}
                        className="inline-flex items-center px-6 py-3 border border-green-200 rounded-xl text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === app.user_id ? (
                          <RiLoader4Line className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RiCheckboxCircleLine className="w-4 h-4 mr-2" />
                        )}
                        Approve Application
                      </button>
                      
                      <button
                        onClick={() => updateStatus(app.user_id, 'rejected')}
                        disabled={actionLoading === app.user_id}
                        className="inline-flex items-center px-6 py-3 border border-red-200 rounded-xl text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === app.user_id ? (
                          <RiLoader4Line className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RiCloseCircleLine className="w-4 h-4 mr-2" />
                        )}
                        Reject Application
                      </button>
                      
                      <button className="inline-flex items-center px-6 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-rivo-500 focus:border-transparent transition-all">
                        <RiEyeLine className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Avg Response Time</h3>
              <RiTimeLine className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{kpiData.avgResponseTime}</div>
            <p className="text-sm text-slate-600">Days to review</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Completion Rate</h3>
              <RiCheckboxCircleLine className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">92%</div>
            <p className="text-sm text-slate-600">Complete applications</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-enterprise border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Quality Score</h3>
              <RiStarLine className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-600 mb-2">4.8</div>
            <p className="text-sm text-slate-600">Average rating</p>
          </div>
        </div>
      </div>
    </div>
  )
} 