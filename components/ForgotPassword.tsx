'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { retryAuthOperation } from '@/lib/auth-utils'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const supabase = createClientComponentClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    try {
      console.log('Attempting password reset for email:', email)
      
      // Use retry wrapper for auth operations that might hit rate limits
      const { error } = await retryAuthOperation(async () => {
        return await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        })
      })
      
      if (error) {
        console.error('Password reset error:', error)
        throw error
      }
      
      console.log('Password reset email sent successfully')
      setIsSuccess(true)
      setMessage('Check your email for a password reset link. If you don\'t see it, check your spam folder.')
      
    } catch (err: any) {
      console.error('Password reset error caught:', err)
      if (err.message?.includes('rate limit')) {
        setMessage('Too many password reset attempts. Please wait a moment and try again.')
      } else if (err.message?.includes('email not confirmed')) {
        setMessage('Please verify your email address before resetting your password.')
      } else {
        // Don't reveal if email exists or not for security reasons
        setMessage('If an account with that email exists, you will receive a password reset link.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-green-100 text-green-700 rounded text-sm">
          <strong>Email sent!</strong><br />
          {message}
        </div>
        
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          
          <button
            onClick={() => {
              setIsSuccess(false)
              setMessage(null)
              setEmail('')
            }}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Try again
          </button>
          
          <div className="mt-4">
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

  return (
    <div className="space-y-6">
      {message && !isSuccess && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          {message}
        </div>
      )}
      
      <div className="text-center text-gray-600 text-sm">
        Enter your email address and we'll send you a link to reset your password.
      </div>
      
      <form onSubmit={handleResetPassword} className="space-y-4">
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
            placeholder="Enter your email address"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
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