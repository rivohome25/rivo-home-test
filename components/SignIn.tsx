'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { retryAuthOperation, clearSessionCache } from '@/lib/auth-utils'

export function SignIn() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/dashboard'
  const message = searchParams.get('message')
  const emailParam = searchParams.get('email')
  
  const [email, setEmail] = useState(emailParam || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  // Handle success messages from URL params
  useEffect(() => {
    if (message === 'password-reset-success') {
      setSuccessMessage('Your password has been reset successfully! You can now sign in with your new password.')
    } else if (message === 'account-created') {
      setSuccessMessage('Account created successfully! Please sign in with your new credentials.')
    }
  }, [message])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      console.log('Attempting to sign in with email:', email)
      
      // Use retry wrapper for auth operations that might hit rate limits
      const { data, error } = await retryAuthOperation(async () => {
        return await supabase.auth.signInWithPassword({
          email,
          password
        })
      })
      
      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
      
      console.log('Sign in successful, session data:', data.session)
      
      if (data.session) {
        // Clear cache after successful sign-in
        clearSessionCache()
        
        // Simple redirect logic - let the middleware and pages handle role-based routing
        if (redirectPath.includes('provider-onboarding')) {
          console.log('Redirecting to provider onboarding route')
          // Ensure user has provider role for this path
          const userRole = data.user.user_metadata?.role as string || ''
          if (userRole !== 'provider') {
            await retryAuthOperation(async () => {
              return await supabase.auth.updateUser({
                data: { role: 'provider' }
              })
            })
          }
          router.push(redirectPath)
          return
        }
        
        // For all other cases, redirect to dashboard and let the dashboard handle role-based routing
        console.log('Redirecting to dashboard for role-based routing')
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Sign in error caught:', err)
      if (err.message?.includes('rate limit')) {
        setError('Too many sign-in attempts. Please wait a moment and try again.')
      } else {
        setError(err.message || 'Failed to sign in')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Determine the redirect URL for OAuth callback
      const callbackUrl = `${window.location.origin}/auth/callback`
      
      // Include the redirect path in the state for callback handling
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            // If we're redirecting to provider onboarding, set provider role
            role: redirectPath.includes('provider-onboarding') ? 'provider' : 'homeowner'
          }
        }
      })
      
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="p-3 bg-green-100 text-green-700 rounded text-sm">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-2 px-4 text-gray-700 hover:bg-gray-50 transition"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in with Google
      </button>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>
      
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="text-right mt-2">
            <a 
              href="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Forgot your password?
            </a>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        
        <p className="text-sm text-center mt-4">
          Don't have an account?{' '}
          <a href="/sign-up" className="text-blue-600 hover:text-blue-800 underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  )
} 