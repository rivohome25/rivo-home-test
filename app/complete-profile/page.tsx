'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function CompleteProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'homeowner' | 'provider'>('homeowner')
  const [tier, setTier] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingProfile, setExistingProfile] = useState<boolean>(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/sign-in')
        return
      }
      
      setUser(session.user)
      
      // Check if the user already has a profile (existing user)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, tier')
        .eq('id', session.user.id)
        .single()
      
      if (profile) {
        // User already has a profile, set as existing user
        setExistingProfile(true)
        setRole(profile.role)
        setTier(profile.tier)
      }
      
      setLoading(false)
    }
    
    getUser()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    try {
      setSubmitting(true)
      setError(null)
      
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          role, 
          tier: role === 'homeowner' ? tier : 0 // Providers always start at tier 0
        })
      
      if (error) throw error
      
      // If existing user, redirect to settings, otherwise to onboarding based on role
      if (existingProfile) {
        router.push('/settings')
      } else {
        // New user - send to appropriate onboarding based on role
        if (role === 'provider') {
          router.push('/provider-onboarding') // Providers go to provider onboarding
        } else {
          router.push('/onboarding') // Homeowners go to homeowner onboarding
        }
      }
    } catch (err: any) {
      console.error('Error creating profile:', err)
      setError(err.message || 'Failed to create profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex justify-center items-center py-12">
          <div className="animate-pulse text-xl">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 flex justify-center items-center py-12">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-center">
              {existingProfile ? 'Update Your Profile' : 'Complete Your Profile'}
            </h1>
            
            <div className="mb-6">
              <p className="text-gray-600">
                {existingProfile 
                  ? `Welcome back, ${user?.user_metadata?.name || user?.email}! Update your profile settings below.`
                  : `Welcome to RivoHome, ${user?.user_metadata?.name || user?.email}! Let's set up your profile before we get started.`
                }
              </p>
            </div>
            
            {error && (
              <div className="mb-6 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  I am a:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('homeowner')}
                    className={`py-3 px-4 border rounded-lg ${
                      role === 'homeowner' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Homeowner
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('provider')}
                    className={`py-3 px-4 border rounded-lg ${
                      role === 'provider' 
                        ? 'bg-blue-50 border-blue-500 text-blue-700' 
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Service Provider
                  </button>
                </div>
              </div>
              
              {role === 'homeowner' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Choose your tier:
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setTier(0)}
                      className={`py-3 px-4 border rounded-lg ${
                        tier === 0 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      Free
                    </button>
                    <button
                      type="button"
                      onClick={() => setTier(1)}
                      className={`py-3 px-4 border rounded-lg ${
                        tier === 1 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      Premium
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {tier === 0 ? 
                      "Basic features for home maintenance tracking." : 
                      "Enhanced features including DIY library access."}
                  </p>
                </div>
              )}
              
              {role === 'provider' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <p className="font-medium text-yellow-800">Service Provider Information</p>
                  <p className="mt-1 text-yellow-700">
                    As a service provider, your account will start at the basic tier. 
                    You can add your services and complete your provider profile after registration.
                  </p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition ${
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Saving...' : existingProfile ? 'Update Profile' : 'Complete Profile'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 