'use client'

import { useState, useEffect } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import DeleteAccountButton from '@/components/DeleteAccountButton'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, User, Mail, Shield, Calendar, FileText, ExternalLink } from 'lucide-react'
import HomeownerNavigationClient from '@/components/HomeownerNavigationClient'
import ProviderNavigationClient from '@/components/ProviderNavigationClient'
import SettingsNavigation from '@/components/SettingsNavigation'

export default function SettingsPage() {
  const supabaseClient = useSupabaseClient()
  const supabase = createClientComponentClient()
  const user = useUser()
  const router = useRouter()

  const [role, setRole] = useState<'homeowner'|'provider'|'admin'|null>(null)
  const [fullName, setFullName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [joinedDate, setJoinedDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [resettingOnboarding, setResettingOnboarding] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleResetOnboarding = async () => {
    if (!confirm('Are you sure you want to reset your provider onboarding? This will clear your progress and you\'ll need to complete the onboarding process again.')) {
      return
    }

    try {
      setResettingOnboarding(true)
      
      const response = await fetch('/api/reset-provider-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset onboarding')
      }

      alert('Your provider onboarding has been reset! You can now start the onboarding process again.')
      router.push('/provider-onboarding')
      
    } catch (err: any) {
      console.error('Error resetting onboarding:', err)
      alert('Failed to reset onboarding: ' + err.message)
    } finally {
      setResettingOnboarding(false)
    }
  }

  // Listen for auth state changes to handle sign-out gracefully
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('User signed out, redirecting...')
          setIsSigningOut(true)
          setSession(null)
          // Give a small delay to allow sign-out to complete, then redirect
          setTimeout(() => {
            router.push('/sign-in')
          }, 500)
          return
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session)
          setIsSigningOut(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, router])

  // First check session directly to avoid race conditions
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error fetching session:', error)
          return
        }
        
        setSession(data.session)
        
        // If no session, redirect to sign-in after a short delay
        if (!data.session) {
          setTimeout(() => {
            router.push('/sign-in')
          }, 1000)
        }
      } catch (err) {
        console.error('Error checking session:', err)
      }
    }
    
    checkSession()
  }, [supabase.auth, router])

  // Load current profile data
  useEffect(() => {
    let isMounted = true;
    
    const loadProfileData = async () => {
      try {
        // If we're in the process of signing out, don't try to load profile data
        if (isSigningOut) {
          return
        }
        
        // Double-check session exists before proceeding
        const { data: currentSession } = await supabase.auth.getSession()
        if (!currentSession.session || !currentSession.session.user) {
          console.log('No valid session found, skipping profile load')
          if (isMounted) {
            setLoading(false)
          }
          return
        }
        
        // Get user from session if user object isn't available yet
        const userId = user?.id || currentSession.session.user.id
        const userEmail = user?.email || currentSession.session.user.email
        
        if (!userId) {
          if (isMounted) setLoading(false)
          return
        }
        
        // Set email from auth
        if (userEmail) {
          setEmail(userEmail)
        }
        
        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name, created_at')
          .eq('id', userId)
          .single()
        
        // Only update state if component is still mounted and we're not signing out
        if (!isMounted || isSigningOut) return;
        
        if (profileError) {
          // Only log error if it's not related to sign-out
          if (!profileError.message?.includes('JWT') && !isSigningOut) {
            console.error('Error loading profile:', profileError);
            setError('Failed to load your profile. Please try again.');
          }
        } else if (profileData) {
          setRole(profileData.role as any)
          setFullName(profileData.full_name || '')
          if (profileData.created_at) {
            setJoinedDate(new Date(profileData.created_at).toLocaleDateString())
          }
          
          // If user is a provider, fetch their documents
          if (profileData.role === 'provider') {
            try {
              const { data: providerDocs, error: docsError } = await supabase
                .from('provider_documents')
                .select('*')
                .eq('provider_id', userId)
                .order('uploaded_at', { ascending: false })
              
              if (!docsError && providerDocs) {
                // Create signed URLs for the documents
                const docsWithUrls = await Promise.all(providerDocs.map(async doc => {
                  const { data } = await supabase
                    .storage
                    .from('provider-documents')
                    .createSignedUrl(doc.file_path, 3600) // 1 hour expiry
                    
                  return { ...doc, signedUrl: data?.signedUrl }
                }))
                
                setDocuments(docsWithUrls)
              }
            } catch (docErr) {
              console.error('Error loading provider documents:', docErr)
            }
          }
        }
      } catch (err) {
        // Only log unexpected errors if we're not signing out
        if (!isSigningOut) {
          console.error('Unexpected error:', err);
          if (isMounted) {
            setError('An unexpected error occurred. Please refresh the page.');
          }
        }
      } finally {
        // Always set loading to false if component is mounted and not signing out
        if (isMounted && !isSigningOut) {
          setLoading(false)
        }
      }
    }
    
    loadProfileData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [user, supabase, router, session, isSigningOut])

  const handleSave = async () => {
    if ((!user && !session) || role == null) return

    try {
      setIsSaving(true)
      setError(null)
      
      const userId = user?.id || session?.user?.id
      if (!userId) {
        throw new Error('User ID not found')
      }
      
      // Update profile with full name (keep existing role and other fields)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName 
        })
        .eq('id', userId)
      
      if (updateError) {
        throw updateError;
      }
      
      alert('Settings saved successfully!')
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-center text-gray-600">Loading your profile...</p>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex justify-between">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
            <button 
              onClick={() => router.push('/dashboard')} 
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // If no session/user but we're not in loading state, show an error
  if (!user && !session?.user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-yellow-700 mb-2">Session Expired</h2>
            <p className="text-yellow-600 mb-4">Your session appears to have expired. Please sign in again.</p>
            <button 
              onClick={() => router.push('/sign-in')} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {role === 'provider' ? (
        <ProviderNavigationClient 
          title="General Settings" 
          currentPage="settings"
        />
      ) : (
        <HomeownerNavigationClient 
          title="General Settings" 
          currentPage="settings"
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">
        <div className="max-w-2xl mx-auto">
          {/* Add settings sub-navigation */}
          <SettingsNavigation userRole={role || 'homeowner'} />
          
          {/* Account Information */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold">Account Information</h2>
            </div>
            
            {/* Full Name */}
            <div className="mb-6">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
                {email}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Email changes must be made through your account security settings
              </p>
            </div>

            {/* Account Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="h-4 w-4 inline mr-1" />
                Account Type
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <span className="capitalize font-medium">{role}</span>
                {role === 'provider' && (
                  <span className="ml-2 text-sm text-gray-600">
                    - Service Provider Account
                  </span>
                )}
                {role === 'homeowner' && (
                  <span className="ml-2 text-sm text-gray-600">
                    - Property Owner Account
                  </span>
                )}
                {role === 'admin' && (
                  <span className="ml-2 text-sm text-gray-600">
                    - Administrator Account
                  </span>
                )}
              </div>
            </div>

            {/* Member Since */}
            {joinedDate && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Member Since
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
                  {joinedDate}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Provider Documents Section */}
          {role === 'provider' && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex items-center mb-6">
                <FileText className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-semibold">Uploaded Documents</h2>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents uploaded yet.</p>
                  <p className="text-sm">Complete your provider onboarding to upload required documents.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {doc.doc_type === 'license' && 'Business License'}
                              {doc.doc_type === 'insurance' && 'Insurance Certificate'}
                              {doc.doc_type === 'other' && (doc.document_title || 'Other Document')}
                            </h3>
                            <div className="text-sm text-gray-500 space-x-4">
                              <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                              {doc.license_number && <span>License #: {doc.license_number}</span>}
                              {doc.issuing_state && <span>State: {doc.issuing_state}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Verified
                        </span>
                        {doc.signedUrl && (
                          <a
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/provider-onboarding/documents-upload')}
                  className="px-4 py-2 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
                >
                  Manage Documents
                </button>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/settings/billing')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium text-blue-600">Manage Billing</div>
                <div className="text-sm text-gray-600">View subscription, invoices, and payment methods</div>
              </button>
              <button
                onClick={() => router.push('/settings/notifications')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium text-blue-600">Notification Settings</div>
                <div className="text-sm text-gray-600">Configure email and push notifications</div>
              </button>
              {role === 'provider' && (
                <button
                  onClick={handleResetOnboarding}
                  disabled={resettingOnboarding}
                  className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-orange-600">
                    {resettingOnboarding ? 'Resetting...' : 'Reset Provider Onboarding'}
                  </div>
                  <div className="text-sm text-gray-600">Start the provider onboarding process again</div>
                </button>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white shadow rounded-lg p-6 border border-red-200">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
            <p className="text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <DeleteAccountButton />
          </div>
        </div>
      </div>
    </div>
  )
} 