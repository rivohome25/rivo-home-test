'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { retryAuthOperation, clearSessionCache } from '@/lib/auth-utils'

export function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const supabase = createClientComponentClient()

  // Check if user has a valid session for password reset
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session check error:', error)
          setMessage('Invalid reset link. Please request a new password reset.')
          setCheckingSession(false)
          return
        }
        
        if (session) {
          console.log('Valid session found for password reset')
          setIsValidSession(true)
        } else {
          console.log('No valid session for password reset')
          setMessage('This password reset link is invalid or has expired. Please request a new one.')
        }
      } catch (err) {
        console.error('Error checking session:', err)
        setMessage('Error validating reset link. Please try again.')
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [supabase.auth])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    // Basic validation
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.')
      setLoading(false)
      return
    }
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      setLoading(false)
      return
    }
    
    try {
      console.log('Attempting to update password')
      
      // Use retry wrapper for auth operations that might hit rate limits
      const { error } = await retryAuthOperation(async () => {
        return await supabase.auth.updateUser({
          password: password
        })
      })
      
      if (error) {
        console.error('Password update error:', error)
        throw error
      }
      
      console.log('Password updated successfully')
      setIsSuccess(true)
      setMessage('Your password has been updated successfully!')
      
      // Clear cache after successful password reset
      clearSessionCache()
      
      // Redirect to sign-in after a short delay
      setTimeout(() => {
        router.push('/sign-in?message=password-reset-success')
      }, 2000)
      
    } catch (err: any) {
      console.error('Password reset error caught:', err)
      if (err.message?.includes('rate limit')) {
        setMessage('Too many attempts. Please wait a moment and try again.')
      } else if (err.message?.includes('session')) {
        setMessage('Your reset session has expired. Please request a new password reset link.')
      } else {
        setMessage(err.message || 'Failed to update password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Validating reset link...</p>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-red-100 text-red-700 rounded text-sm">
          {message || 'This password reset link is invalid or has expired.'}
        </div>
        
        <div className="text-center space-y-4">
          <a 
            href="/forgot-password" 
            className="inline-block py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Request New Reset Link
          </a>
          
          <div>
            <a 
              href="/sign-in" 
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              ← Back to sign in
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-green-100 text-green-700 rounded text-sm">
          <strong>Success!</strong><br />
          {message}
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Redirecting you to sign in...
          </p>
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && !isSuccess && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          {message}
        </div>
      )}
      
      <div className="text-center text-gray-600 text-sm">
        Please enter your new password below.
      </div>
      
      <form onSubmit={handlePasswordReset} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your new password"
          />
          <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Confirm your new password"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
      
      <div className="text-center">
        <a 
          href="/sign-in" 
          className="text-blue-600 hover:text-blue-800 underline text-sm"
        >
          ← Back to sign in
        </a>
      </div>
    </div>
  )
} 