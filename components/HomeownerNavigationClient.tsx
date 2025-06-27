/**
 * HomeownerNavigationClient.tsx
 * Client-side reusable navigation component for homeowner dashboard pages
 * Provides consistent navigation across all homeowner dashboard sections
 */

'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import SignOutButton from '@/components/SignOutButton'

interface HomeownerNavigationClientProps {
  title?: string
  currentPage?: 'dashboard' | 'my-bookings' | 'service-providers' | 'find-providers' | 'diy-library' | 'properties' | 'my-schedule' | 'documents' | 'settings'
}

export default function HomeownerNavigationClient({ title = "Dashboard", currentPage }: HomeownerNavigationClientProps) {
  const [userName, setUserName] = useState<string>('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        
        setUserName(profile?.full_name || user.email || 'User')
      }
    }
    
    fetchUserName()
  }, [supabase])

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard', page: 'dashboard' },
    { href: '/dashboard/properties', label: 'Properties', page: 'properties' },
    { href: '/dashboard/my-schedule', label: 'My Schedule', page: 'my-schedule' },
    { href: '/dashboard/documents', label: 'Documents', page: 'documents' },
    { href: '/dashboard/my-bookings', label: 'My Appointments', page: 'my-bookings' },
    { href: '/dashboard/find-providers', label: 'Find Providers', page: 'find-providers' },
    { href: '/dashboard/diy-library', label: 'DIY Library', page: 'diy-library' },
    { href: '/settings', label: 'Settings', page: 'settings' },
  ]

  return (
    <div className="rivo-gradient p-6 text-white mb-6">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left side - Clean Title and Welcome */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-white/90 text-lg mt-1">Welcome back, {userName}</p>
          </div>
          
          {/* Right side - Clean Navigation */}
          <div className="flex flex-wrap gap-3">
            {navigationItems.map((item) => {
              const isActive = currentPage === item.page
              
              return (
                <a 
                  key={item.page}
                  href={item.href} 
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    isActive 
                      ? 'bg-white bg-opacity-25 text-white shadow-sm' 
                      : 'bg-white bg-opacity-10 text-white/90 hover:bg-opacity-20 hover:text-white'
                  }`}
                >
                  {item.label}
                </a>
              )
            })}
            
            {/* Clean Sign Out Button */}
            <div className="ml-2">
              <SignOutButton variant="button" showIcon={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 