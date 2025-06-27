'use client'

import { useState, useEffect } from 'react'
import { 
  RiUserAddLine, 
  RiFileTextLine, 
  RiCheckboxCircleLine, 
  RiAlertLine,
  RiSettings4Line,
  RiTimeLine
} from 'react-icons/ri'

interface ActivityItem {
  id: string
  type: 'user_signup' | 'provider_application' | 'approval' | 'system_alert' | 'admin_action'
  title: string
  description: string
  timestamp: Date
  user?: {
    name: string
    avatar?: string
    initials: string
  }
  metadata?: {
    status?: 'success' | 'warning' | 'error' | 'info'
    action?: string
  }
}

interface ActivityFeedProps {
  activities?: ActivityItem[]
  loading?: boolean
  showHeader?: boolean
  maxItems?: number
  autoRefresh?: boolean
  className?: string
}

// Mock data for demonstration
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'user_signup',
    title: 'New User Registration',
    description: 'Sarah Johnson signed up as a homeowner',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    user: { name: 'Sarah Johnson', initials: 'SJ' },
    metadata: { status: 'success' }
  },
  {
    id: '2',
    type: 'provider_application',
    title: 'Provider Application',
    description: 'Elite Plumbing submitted application for review',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    user: { name: 'Elite Plumbing', initials: 'EP' },
    metadata: { status: 'warning' }
  },
  {
    id: '3',
    type: 'approval',
    title: 'Provider Approved',
    description: 'ProClean Services has been approved and activated',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    user: { name: 'ProClean Services', initials: 'PS' },
    metadata: { status: 'success' }
  },
  {
    id: '4',
    type: 'system_alert',
    title: 'System Alert',
    description: 'High server load detected - auto-scaling initiated',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    metadata: { status: 'warning' }
  },
  {
    id: '5',
    type: 'admin_action',
    title: 'Admin Action',
    description: 'User permissions updated for John Doe',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    user: { name: 'Admin', initials: 'AD' },
    metadata: { status: 'info', action: 'permission_update' }
  }
]

const getActivityIcon = (type: string, status?: string) => {
  const iconClass = "w-5 h-5"
  
  switch (type) {
    case 'user_signup':
      return <RiUserAddLine className={`${iconClass} text-enterprise-success-600`} />
    case 'provider_application':
      return <RiFileTextLine className={`${iconClass} text-enterprise-warning-600`} />
    case 'approval':
      return <RiCheckboxCircleLine className={`${iconClass} text-enterprise-success-600`} />
    case 'system_alert':
      return <RiAlertLine className={`${iconClass} text-enterprise-error-600`} />
    case 'admin_action':
      return <RiSettings4Line className={`${iconClass} text-enterprise-info-600`} />
    default:
      return <RiTimeLine className={`${iconClass} text-slate-500`} />
  }
}

const getStatusIndicator = (status?: string) => {
  switch (status) {
    case 'success':
      return 'status-indicator-online'
    case 'warning':
      return 'status-indicator-warning'
    case 'error':
      return 'status-indicator-offline'
    default:
      return 'status-indicator-offline'
  }
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  }
}

export default function ActivityFeed({
  activities = mockActivities,
  loading = false,
  showHeader = true,
  maxItems = 10,
  autoRefresh = false,
  className = ''
}: ActivityFeedProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setCurrentTime(new Date())
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const displayActivities = activities.slice(0, maxItems)

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-enterprise border border-slate-100 ${className}`}>
        {showHeader && (
          <div className="p-6 border-b border-slate-100">
            <div className="skeleton-title w-32 mb-2"></div>
            <div className="skeleton-text w-48"></div>
          </div>
        )}
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
              <div className="flex-1">
                <div className="skeleton-text w-48 mb-2"></div>
                <div className="skeleton-text w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl shadow-enterprise border border-slate-100 ${className}`}>
      {showHeader && (
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
              <p className="text-sm text-slate-600 mt-1">Latest system events and user actions</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="status-indicator-online"></div>
              <span className="text-xs text-slate-500">Live</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="space-y-1">
          {displayActivities.map((activity, index) => (
            <div
              key={activity.id}
              className={`activity-item ${index < 2 ? 'activity-item-new' : ''} animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start space-x-3">
                {/* Activity Icon */}
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-100">
                  {getActivityIcon(activity.type, activity.metadata?.status)}
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-900">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">
                        {activity.description}
                      </p>
                      
                      {/* User info */}
                      {activity.user && (
                        <div className="flex items-center mt-2 space-x-2">
                          <div className="w-6 h-6 rounded-full bg-rivo-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-rivo-700">
                              {activity.user.initials}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {activity.user.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status and Timestamp */}
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                      {activity.metadata?.status && (
                        <div className={getStatusIndicator(activity.metadata.status)}></div>
                      )}
                      <span className="text-xs text-slate-500">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        {activities.length > maxItems && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button className="w-full text-sm text-rivo-600 hover:text-rivo-700 font-medium transition-colors">
              View all {activities.length} activities →
            </button>
          </div>
        )}

        {/* Empty State */}
        {activities.length === 0 && (
          <div className="text-center py-8">
            <RiTimeLine className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  )
} 