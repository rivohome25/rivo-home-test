'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

// Types for application data
interface Application {
  user_id: string
  email: string
  full_name: string
  business_name: string
  phone: string
  zip_code: string
  review_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  document_count: number
  services_count: number
  reviews_count: number
  agreements_count: number
}

// Types for pagination
interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ApplicationsPage() {
  const { toast } = useToast()
  const router = useRouter()
  
  // State
  const [applications, setApplications] = useState<Application[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/applications?page=${pagination.page}&limit=${pagination.limit}&status=${statusFilter}`
      )
      
      if (!res.ok) {
        throw new Error('Failed to fetch applications')
      }
      
      const data = await res.json()
      setApplications(data.data || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        title: 'Error',
        description: 'Failed to load provider applications',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter, toast])

  // Load applications when component mounts or filters change
  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Status badge component with appropriate colors
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = 'bg-gray-100'
    let textColor = 'text-gray-800'
    let dotColor = 'bg-gray-400'
    
    switch (status) {
      case 'pending':
        bgColor = 'bg-yellow-50'
        textColor = 'text-yellow-800'
        dotColor = 'bg-yellow-400'
        break
      case 'approved':
        bgColor = 'bg-green-50'
        textColor = 'text-green-800'
        dotColor = 'bg-green-400'
        break
      case 'rejected':
        bgColor = 'bg-red-50'
        textColor = 'text-red-800'
        dotColor = 'bg-red-400'
        break
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // Get summary stats
  const pendingCount = applications.filter(app => app.review_status === 'pending').length
  const approvedCount = applications.filter(app => app.review_status === 'approved').length
  const rejectedCount = applications.filter(app => app.review_status === 'rejected').length

  return (
    <div className="space-y-8">
      {/* Header with gradient background similar to dashboard */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Provider Applications</h1>
            <p className="opacity-90 mt-1">Review and manage service provider applications</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Total Applications</div>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Applications */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Filter Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Applications</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Filter by status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Applications</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No applications found</p>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.user_id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {app.full_name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 truncate">{app.full_name}</p>
                          <StatusBadge status={app.review_status} />
                        </div>
                        <p className="text-sm text-gray-500 truncate">{app.business_name}</p>
                        <p className="text-xs text-gray-400">{app.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{app.document_count}</p>
                      <p className="text-xs">Documents</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{app.services_count}</p>
                      <p className="text-xs">Services</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{new Date(app.created_at).toLocaleDateString()}</p>
                      <p className="text-xs">Applied</p>
                    </div>
                    <Link 
                      href={`/admin/applications/${app.user_id}`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {applications.length} of {pagination.total} applications
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    pagination.page === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    pagination.page === pagination.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 