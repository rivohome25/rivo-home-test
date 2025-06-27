'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import LicenseUploader from '../components/LicenseUploader'
import InsuranceUploader from '../components/InsuranceUploader'
import OtherDocumentsUploader from '../components/OtherDocumentsUploader'

export default function DocumentsUploadStep() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [docs, setDocs] = useState<any[]>([])   // metadata + publicURL

  // Get current user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  // fetch existing uploads
  useEffect(() => {
    if (!user) return
    
    const fetchDocuments = async () => {
      // Get documents from metadata table
      const { data: existing, error: fetchErr } =
        await supabase
          .from('provider_documents')
          .select('*')
          .eq('provider_id', user.id)
          
      if (fetchErr) {
        setError(fetchErr.message)
        return
      }

      // Skip if no documents
      if (!existing || existing.length === 0) {
        setDocs([])
        return
      }

      // Build signed URLs for display
      const withUrls = await Promise.all(existing.map(async doc => {
        const { data } = await supabase
          .storage
          .from('provider-documents')
          .createSignedUrl(doc.file_path, 60)
          
        return { ...doc, publicURL: data?.signedUrl }
      }))
      
      setDocs(withUrls)
    }

    fetchDocuments().catch(console.error)
  }, [supabase, user])

  // Handle file + metadata upload for license
  async function handleLicenseUpload(
    file: File,
    sanitizedName: string,
    licenseNumber: string,
    issuingState: string
  ) {
    if (!user) {
      setError('Not logged in')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      // 1) Upload to storage with sanitized filename
      const filePath = `providers/${user.id}/license/${Date.now()}_${sanitizedName}`
      const { error: upErr } = await supabase
        .storage
        .from('provider-documents')
        .upload(filePath, file, {
          metadata: { provider_id: user.id }
        })
        
      if (upErr) {
        setError(upErr.message)
        return
      }

      // 2) Record in metadata table
      const { error: dbErr } = await supabase
        .from('provider_documents')
        .insert({
          provider_id: user.id,
          doc_type: 'license',
          file_path: filePath,
          license_number: licenseNumber,
          issuing_state: issuingState
        })
        
      if (dbErr) {
        setError(dbErr.message)
        return
      }

      // 3) Refresh list
      router.refresh()
      
      // Force reload the documents list
      const { data: refreshedDocs } = await supabase
        .from('provider_documents')
        .select('*')
        .eq('provider_id', user.id)

      if (refreshedDocs) {
        const withUrls = await Promise.all(refreshedDocs.map(async doc => {
          const { data } = await supabase
            .storage
            .from('provider-documents')
            .createSignedUrl(doc.file_path, 60)
            
          return { ...doc, publicURL: data?.signedUrl }
        }))
        
        setDocs(withUrls)
      }
    } catch (err) {
      console.error('License upload error:', err)
      setError('Failed to upload license. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle file + metadata upload for insurance
  async function handleInsuranceUpload(file: File, sanitizedName: string) {
    if (!user) {
      setError('Not logged in')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      // 1) Upload to storage with sanitized filename
      const filePath = `providers/${user.id}/insurance/${Date.now()}_${sanitizedName}`
      const { error: upErr } = await supabase
        .storage
        .from('provider-documents')
        .upload(filePath, file, {
          metadata: { provider_id: user.id }
        })
        
      if (upErr) {
        setError(upErr.message)
        return
      }

      // 2) Record in metadata table
      const { error: dbErr } = await supabase
        .from('provider_documents')
        .insert({
          provider_id: user.id,
          doc_type: 'insurance',
          file_path: filePath
        })
        
      if (dbErr) {
        setError(dbErr.message)
        return
      }

      // 3) Refresh list
      router.refresh()
      
      // Force reload the documents list
      const { data: refreshedDocs } = await supabase
        .from('provider_documents')
        .select('*')
        .eq('provider_id', user.id)

      if (refreshedDocs) {
        const withUrls = await Promise.all(refreshedDocs.map(async doc => {
          const { data } = await supabase
            .storage
            .from('provider-documents')
            .createSignedUrl(doc.file_path, 60)
            
          return { ...doc, publicURL: data?.signedUrl }
        }))
        
        setDocs(withUrls)
      }
    } catch (err) {
      console.error('Insurance upload error:', err)
      setError('Failed to upload insurance certificate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle file + metadata upload for other documents
  async function handleOtherDocumentUpload(file: File, sanitizedName: string, documentTitle: string) {
    if (!user) {
      setError('Not logged in')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      // 1) Upload to storage with sanitized filename
      const filePath = `providers/${user.id}/other/${Date.now()}_${sanitizedName}`
      const { error: upErr } = await supabase
        .storage
        .from('provider-documents')
        .upload(filePath, file, {
          metadata: { provider_id: user.id }
        })
        
      if (upErr) {
        setError(upErr.message)
        return
      }

      // 2) Record in metadata table
      const { error: dbErr } = await supabase
        .from('provider_documents')
        .insert({
          provider_id: user.id,
          doc_type: 'other',
          file_path: filePath,
          document_title: documentTitle
        })
        
      if (dbErr) {
        setError(dbErr.message)
        return
      }

      // 3) Refresh list
      router.refresh()
      
      // Force reload the documents list
      const { data: refreshedDocs } = await supabase
        .from('provider_documents')
        .select('*')
        .eq('provider_id', user.id)

      if (refreshedDocs) {
        const withUrls = await Promise.all(refreshedDocs.map(async doc => {
          const { data } = await supabase
            .storage
            .from('provider-documents')
            .createSignedUrl(doc.file_path, 60)
            
          return { ...doc, publicURL: data?.signedUrl }
        }))
        
        setDocs(withUrls)
      }
    } catch (err) {
      console.error('Other document upload error:', err)
      setError('Failed to upload document. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Step 3: Documents Upload</h1>
      {error && <p className="text-red-600">{error}</p>}

      {/* License Upload */}
      <section>
        <h2 className="font-medium">Business License</h2>
        <LicenseUploader
          onUpload={handleLicenseUpload}
          existing={docs.filter(d => d.doc_type === 'license')}
        />
      </section>

      {/* Insurance Upload */}
      <section>
        <h2 className="font-medium">Insurance Certificate</h2>
        <InsuranceUploader
          onUpload={handleInsuranceUpload}
          existing={docs.filter(d => d.doc_type === 'insurance')}
        />
      </section>

      {/* Other Documents Upload */}
      <section>
        <h2 className="font-medium">Other Document(s)</h2>
        <OtherDocumentsUploader
          onUpload={handleOtherDocumentUpload}
          existing={docs.filter(d => d.doc_type === 'other')}
        />
      </section>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => router.push('/provider-onboarding/business-profile')}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Continue
        </button>
      </div>
    </div>
  )
} 