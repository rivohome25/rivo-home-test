'use client'

import { useState, useEffect } from 'react'
import { useRouter }   from 'next/navigation'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import Image from 'next/image'
import { validateUploadedFile } from '@/lib/secure-file-validation'

// Social media platform options
const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { value: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourusername' },
  { value: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/yourusername' },
  { value: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourprofile' },
  { value: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourusername' },
  { value: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/c/yourchannel' },
  { value: 'website', label: 'Website', placeholder: 'https://yourwebsite.com' },
  { value: 'other', label: 'Other', placeholder: 'https://other-platform.com/yourprofile' }
]

interface SocialProfile {
  platform: string
  url: string
}

export default function BusinessProfileStep() {
  const supabase = useSupabaseClient()
  const user     = useUser()
  const router   = useRouter()

  const [bio, setBio]                 = useState('')
  const [logoUrl, setLogoUrl]         = useState('')
  const [portfolio, setPortfolio]     = useState<string[]>([''])
  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([{ platform: '', url: '' }])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string|null>(null)
  
  // Logo upload states
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoErrors, setLogoErrors] = useState<string[]>([])
  const [logoSuccess, setLogoSuccess] = useState(false)

  // Prefill from existing profile
  useEffect(() => {
    if (!user) return
    supabase
      .from('provider_profiles')
      .select('bio,logo_url,portfolio,social_links')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setBio(data.bio || '')
          setLogoUrl(data.logo_url || '')
          if (data.logo_url) {
            setLogoPreview(data.logo_url)
          }
          setPortfolio(data.portfolio?.length ? data.portfolio : [''])
          
          // Convert legacy social_links array to new structure
          if (data.social_links?.length) {
            const profiles = data.social_links.map((url: string) => {
              // Try to detect platform from URL
              let platform = 'other'
              if (url.includes('facebook.com')) platform = 'facebook'
              else if (url.includes('instagram.com')) platform = 'instagram'
              else if (url.includes('twitter.com') || url.includes('x.com')) platform = 'twitter'
              else if (url.includes('linkedin.com')) platform = 'linkedin'
              else if (url.includes('tiktok.com')) platform = 'tiktok'
              else if (url.includes('youtube.com')) platform = 'youtube'
              else if (!url.includes('facebook.com') && !url.includes('instagram.com') && 
                       !url.includes('twitter.com') && !url.includes('linkedin.com') && 
                       !url.includes('tiktok.com') && !url.includes('youtube.com')) {
                platform = 'website'
              }
              
              return { platform, url }
            })
            setSocialProfiles(profiles.length ? profiles : [{ platform: '', url: '' }])
          } else {
            setSocialProfiles([{ platform: '', url: '' }])
          }
        }
      })
  }, [supabase, user])

  const handleLogoSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setLogoFile(null)
      setLogoPreview(logoUrl || null)
      setLogoErrors([])
      return
    }

    setLogoErrors([])
    setLogoSuccess(false)
    
    try {
      // Validate file security
      const validation = await validateUploadedFile(file, 2 * 1024 * 1024) // 2MB limit
      
      if (!validation.isValid) {
        setLogoErrors(validation.errors)
        setLogoFile(null)
        setLogoPreview(logoUrl || null)
        return
      }

      setLogoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error('File validation error:', error)
      setLogoErrors(['Failed to validate file. Please try again.'])
      setLogoFile(null)
      setLogoPreview(logoUrl || null)
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) {
      alert('Please select a valid image file')
      return
    }
    
    setLogoUploading(true)
    try {
      // Use server-side API to handle upload
      const formData = new FormData()
      formData.append('file', logoFile)
      formData.append('docType', 'logo')

      const response = await fetch('/api/provider-documents/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }
      
      // Get the public URL for the uploaded file
      const { data: urlData } = await supabase
        .storage
        .from('provider-documents')
        .getPublicUrl(result.filePath)
      
      if (urlData?.publicUrl) {
        setLogoUrl(urlData.publicUrl)
        setLogoSuccess(true)
      }
      
      // Reset file input
      const input = document.getElementById('logo-file-input') as HTMLInputElement
      if (input) input.value = ''
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLogoUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Filter out empty items from arrays
    const cleanPortfolio = portfolio.filter(url => url.trim() !== '')
    const cleanSocialProfiles = socialProfiles.filter(profile => profile.url.trim() !== '' && profile.platform !== '')
    
    // Convert social profiles back to simple URL array for backward compatibility
    const socialLinks = cleanSocialProfiles.map(profile => profile.url)

    const res = await fetch(
      '/api/provider-onboarding/business-profile',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bio, 
          logo_url: logoUrl, 
          portfolio: cleanPortfolio.length ? cleanPortfolio : [''], 
          social_links: socialLinks.length ? socialLinks : ['']
        })
      }
    )
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Unknown error')
      setLoading(false)
      return
    }

    router.push('/provider-onboarding/external-reviews')
  }

  // Helpers for dynamic lists
  const updateList = (
    list: string[],
    setList: (l: string[]) => void,
    idx: number,
    val: string
  ) => {
    const copy = [...list]
    copy[idx] = val
    setList(copy)
  }
  
  const addItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => 
    setList([...list, ''])
    
  const removeItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, idx: number) =>
    setList(list.filter((_, i) => i !== idx))

  // Helpers for social profiles
  const updateSocialProfile = (idx: number, field: 'platform' | 'url', value: string) => {
    const copy = [...socialProfiles]
    copy[idx] = { ...copy[idx], [field]: value }
    setSocialProfiles(copy)
  }

  const addSocialProfile = () => {
    setSocialProfiles([...socialProfiles, { platform: '', url: '' }])
  }

  const removeSocialProfile = (idx: number) => {
    setSocialProfiles(socialProfiles.filter((_, i) => i !== idx))
  }

  const getPlatformPlaceholder = (platform: string) => {
    const platformData = SOCIAL_PLATFORMS.find(p => p.value === platform)
    return platformData?.placeholder || 'https://'
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Step 4: Business Profile</h1>
      {error && <p className="text-red-600">{error}</p>}

      {/* Bio */}
      <label className="block">
        Bio <span className="text-sm text-gray-500">(max 250 chars)</span>
        <textarea
          required
          maxLength={250}
          value={bio}
          onChange={e => setBio(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </label>

      {/* Logo/Headshot Upload */}
      <div className="space-y-4">
        <h3 className="font-medium">Logo / Headshot</h3>
        
        {/* Preview existing image */}
        {logoPreview && (
          <div className="flex justify-center mb-4">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
              <Image 
                src={logoPreview} 
                alt="Logo preview" 
                width={128} 
                height={128}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Upload Success Message */}
        {logoSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            <div className="text-green-800 text-sm">
              <strong>✅ Image uploaded successfully!</strong>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div>
          <label htmlFor="logo-file-input" className="block text-sm font-medium text-gray-700 mb-2">
            Upload Image (Max 2.0MB)
          </label>
          <input
            id="logo-file-input"
            type="file"
            onChange={handleLogoSelection}
            accept=".jpg,.jpeg,.png"
            disabled={logoUploading}
            className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-medium
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">Accepted formats: JPG, PNG</p>
        </div>

        {/* File Validation Errors */}
        {logoErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-red-800 text-sm">
              <strong>File Validation Failed:</strong>
              <ul className="mt-1 list-disc list-inside">
                {logoErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {logoFile && logoErrors.length === 0 && (
          <button
            type="button"
            onClick={handleLogoUpload}
            disabled={logoUploading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {logoUploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading Image...
              </span>
            ) : (
              'Upload Image'
            )}
          </button>
        )}
      </div>

      {/* Portfolio */}
      <fieldset className="space-y-2">
        <legend className="font-medium">Portfolio URLs</legend>
        {portfolio.map((url, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            <input
              type="url"
              value={url}
              onChange={e => updateList(portfolio, setPortfolio, idx, e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 flex-1"
              placeholder="https://"
            />
            {portfolio.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(portfolio, setPortfolio, idx)}
                className="p-2 text-gray-500 hover:text-red-500"
              >✕</button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addItem(portfolio, setPortfolio)}
          className="text-blue-600 hover:underline text-sm"
        >+ Add another portfolio link</button>
      </fieldset>

      {/* Social Media Profiles */}
      <fieldset className="space-y-3">
        <legend className="font-medium">Social Media Links (optional)</legend>
        <p className="text-sm text-gray-600">Add your social media profiles to help customers connect with you</p>
        
        {socialProfiles.map((profile, idx) => (
          <div key={idx} className="space-y-2 p-3 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex items-center space-x-2">
              <select
                value={profile.platform}
                onChange={e => updateSocialProfile(idx, 'platform', e.target.value)}
                className="block border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select Platform</option>
                {SOCIAL_PLATFORMS.map(platform => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
              
              {socialProfiles.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSocialProfile(idx)}
                  className="p-2 text-gray-500 hover:text-red-500"
                  title="Remove this social media profile"
                >✕</button>
              )}
            </div>
            
            <input
              type="url"
              value={profile.url}
              onChange={e => updateSocialProfile(idx, 'url', e.target.value)}
              placeholder={getPlatformPlaceholder(profile.platform)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={!profile.platform}
            />
          </div>
        ))}
        
        <button
          type="button"
          onClick={addSocialProfile}
          className="text-blue-600 hover:underline text-sm"
        >+ Add another social media profile</button>
      </fieldset>

      {/* Submit/Back Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => router.push('/provider-onboarding/documents-upload')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </form>
  )
} 