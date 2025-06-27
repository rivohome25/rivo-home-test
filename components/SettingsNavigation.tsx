'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, CreditCard, Bell, HelpCircle } from 'lucide-react'

interface SettingsNavigationProps {
  userRole?: 'homeowner' | 'provider' | 'admin'
}

export default function SettingsNavigation({ userRole = 'homeowner' }: SettingsNavigationProps) {
  const pathname = usePathname()
  
  const isGeneralActive = pathname === '/settings'
  const isBillingActive = pathname === '/settings/billing'
  const isNotificationsActive = pathname === '/settings/notifications'
  const isSupportActive = pathname === '/settings/support'

  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex space-x-8" role="tablist">
        <Link
          href="/settings"
          className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            isGeneralActive
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          role="tab"
          aria-selected={isGeneralActive}
        >
          <Settings className="h-4 w-4" />
          <span>General</span>
        </Link>
        
        {/* Only show billing, notifications, and support for homeowners */}
        {userRole === 'homeowner' && (
          <>
            <Link
              href="/settings/billing"
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                isBillingActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={isBillingActive}
            >
              <CreditCard className="h-4 w-4" />
              <span>Billing</span>
            </Link>
            
            <Link
              href="/settings/notifications"
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                isNotificationsActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={isNotificationsActive}
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </Link>
            
            <Link
              href="/settings/support"
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                isSupportActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={isSupportActive}
            >
              <HelpCircle className="h-4 w-4" />
              <span>Support</span>
            </Link>
          </>
        )}
      </div>
    </div>
  )
} 