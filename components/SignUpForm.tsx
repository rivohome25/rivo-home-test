'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export function SignUpForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('homeowner') // Default to homeowner
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string|undefined>()
  const [isRetrying, setIsRetrying] = useState(false)
  
  const supabase = createClientComponentClient()

  // Function to ensure profile exists for the user (fallback if trigger fails)
  const ensureProfileExists = async (userId: string, userRole: string, retryCount = 0) => {
    const maxRetries = 3
    const retryDelay = 1000 // 1 second
    
    try {
      console.log('Checking if profile exists for user:', userId, `(attempt ${retryCount + 1}/${maxRetries + 1})`)
      
      // Wait a moment for auth state to sync if this is the first attempt
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Ensure we have a valid session before proceeding
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.warn('No valid session found, profile creation may fail:', sessionError)
      }
      
      // First, try to get the existing profile
      const { data: existingProfile, error: selectError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .single()
      
      if (existingProfile) {
        console.log('Profile already exists:', existingProfile)
        return true
      }
      
      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking profile:', selectError)
      }
      
      // If no profile exists, create one
      console.log('Creating profile for user:', userId)
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: userRole,
          tier: 0,
          full_name: '',
          is_admin: false  // SECURITY: Never allow client to set admin status
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('Error creating profile:', insertError)
        
        // If it's an RLS policy error and we haven't exceeded retries, try again
        if (insertError.code === '42501' && retryCount < maxRetries) {
          console.log(`RLS policy error, retrying in ${retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          return ensureProfileExists(userId, userRole, retryCount + 1)
        }
        
        return false
      }
      
      console.log('Profile created successfully:', newProfile)
      return true
    } catch (error) {
      console.error('Unexpected error in ensureProfileExists:', error)
      
      // Retry on unexpected errors
      if (retryCount < maxRetries) {
        console.log(`Unexpected error, retrying in ${retryDelay}ms...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return ensureProfileExists(userId, userRole, retryCount + 1)
      }
      
      return false
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(undefined)

    try {
      console.log('Attempting signup with:', { email, role })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            role, // Use the selected role
            tier: 0,
            full_name: '' 
          }
        }
      })

      if (error) {
        console.error('Signup error:', error)
        setMessage(error.message)
        return
      }
      
      console.log('Signup response:', { 
        hasSession: !!data.session, 
        hasUser: !!data.user,
        userConfirmed: data.user?.email_confirmed_at !== null,
        sessionDetails: data.session ? 'Session created' : 'No session'
      })
      
      // If we have a user, ensure profile exists (fallback to database trigger)
      if (data.user) {
        console.log('Ensuring profile exists for user...')
        const profileCreated = await ensureProfileExists(data.user.id, role)
        
        if (!profileCreated) {
          console.warn('Client-side profile creation failed, relying on database trigger...')
          // Don't block the signup flow - the database trigger should handle profile creation
        }
      }
      
      // Check if we have a user but no session (email confirmation case)
      if (data.user && !data.session) {
        // Check if user email is confirmed
        if (data.user.email_confirmed_at) {
          console.log('User confirmed but no session - attempting automatic sign in')
          setMessage('Account created successfully! Signing you in...')
          setIsRetrying(true)
          
          // Wait a moment for database triggers to complete
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Attempt automatic sign-in
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          
          if (signInError) {
            console.error('Auto sign-in failed:', signInError)
            setMessage(`Account created successfully! Please sign in manually: ${signInError.message}`)
            setTimeout(() => {
              router.push(`/sign-in?email=${encodeURIComponent(email)}&message=account-created`)
            }, 3000)
            return
          }
          
          if (signInData.session) {
            console.log('Auto sign-in successful')
            setMessage(`Account created and signed in successfully! Redirecting to ${role} onboarding...`)
            
            setTimeout(() => {
              if (role === 'provider') {
                router.push('/provider-onboarding')
              } else {
                router.push('/onboarding')
              }
            }, 2000)
            return
          }
        } else {
          // Email confirmation required
          console.log('Email confirmation required')
          setMessage('Account created! Please check your email and click the confirmation link before signing in.')
          return
        }
      }
      
      // With email confirmations disabled, we should get a session immediately
      if (data.session) {
        // Message based on role
        setMessage(`Registration successful! Redirecting to ${role} onboarding...`)
        
        // Give user time to see the message
        setTimeout(() => {
          // Route based on role
          if (role === 'provider') {
            router.push('/provider-onboarding')
          } else {
            router.push('/onboarding')
          }
        }, 2000)
      } else {
        // Fallback case - account created but no session
        console.error('Account created but no session returned. Possible causes: database trigger delay, RLS policy issue, or rate limiting.')
        console.error('User data:', data.user)
        
        setMessage('Account created successfully! Redirecting to sign in...')
        
        // Redirect to sign-in with pre-filled email and helpful message
        setTimeout(() => {
          router.push(`/sign-in?email=${encodeURIComponent(email)}&message=account-created`)
        }, 2000)
      }
    } catch (err: any) {
      console.error('Unexpected error during signup:', err)
      
      // Check if it's a rate limiting error
      if (err.message?.includes('rate limit') || err.status === 429) {
        setMessage('Too many signup attempts. Please wait a few minutes and try again.')
      } else {
        setMessage(err.message || 'An unexpected error occurred during signup')
      }
    } finally {
      setLoading(false)
      setIsRetrying(false)
    }
  }

  return (
    <form onSubmit={handleSignUp} className="max-w-md mx-auto space-y-4">
      {message && (
        <div className={`p-3 rounded ${
          message.includes('successful') || message.includes('created') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Email address</span>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Password</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
        <p className="mt-1 text-sm text-gray-500">Minimum 6 characters</p>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">I want to register as a:</span>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        >
          <option value="homeowner">Homeowner</option>
          <option value="provider">Service Provider</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading 
          ? (isRetrying ? 'Signing you in...' : 'Creating account...')
          : 'Create Account'
        }
      </button>

      <p className="text-sm text-center text-gray-600">
        Already have an account?{' '}
        <a href="/sign-in" className="text-blue-600 hover:text-blue-800 underline">
          Sign in
        </a>
      </p>
    </form>
  )
} 