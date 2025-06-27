'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { clearSessionCache } from '@/lib/auth-utils'

interface SignOutButtonProps {
  variant?: 'button' | 'link'
  className?: string
  showIcon?: boolean
}

export default function SignOutButton({ 
  variant = 'button', 
  className = '',
  showIcon = true 
}: SignOutButtonProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const handleSignOut = async () => {
    setLoading(true)
    
    try {
      // Clear session cache before signing out to prevent race conditions
      clearSessionCache()
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
      
      // Redirect to home page after successful sign out
      router.push('/')
      router.refresh()
    } catch (err: any) {
      console.error('Sign out error:', err)
      // Even if there's an error, try to redirect
      router.push('/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const baseClasses = variant === 'link' 
    ? 'text-gray-600 hover:text-gray-800 transition-colors duration-200 flex items-center gap-2'
    : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2'

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={`${baseClasses} ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {showIcon && <LogOut className="w-4 h-4" />}
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
} 