'use client'

import { useState } from 'react'
import { validateUploadedFile } from '@/lib/secure-file-validation'

interface InsuranceUploaderProps {
  onUpload: (file: File, sanitizedName: string) => Promise<void>
  existing: Array<{
    id: string
    file_path: string
    publicURL: string
  }>
}

export default function InsuranceUploader({ onUpload, existing }: InsuranceUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validatedFileName, setValidatedFileName] = useState('')
  const [fileErrors, setFileErrors] = useState<string[]>([])
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setValidatedFileName('')
      setFileErrors([])
      return
    }

    setFileErrors([])
    setUploadSuccess(false)
    
    try {
      // Validate file security
      const validation = await validateUploadedFile(file, 5 * 1024 * 1024) // 5MB limit
      
      if (!validation.isValid) {
        setFileErrors(validation.errors)
        setSelectedFile(null)
        setValidatedFileName('')
        return
      }

      setSelectedFile(file)
      setValidatedFileName(validation.sanitizedName)
      
    } catch (error) {
      console.error('File validation error:', error)
      setFileErrors(['Failed to validate file. Please try again.'])
      setSelectedFile(null)
      setValidatedFileName('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !validatedFileName) {
      alert('Please select a valid file')
      return
    }
    
    setUploading(true)
    try {
      // Use server-side API to avoid RLS recursion issues
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('docType', 'insurance')

      const response = await fetch('/api/provider-documents/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }
      
      // Reset form on success
      setSelectedFile(null)
      setValidatedFileName('')
      setFileErrors([])
      setUploadSuccess(true)
      
      // Clear file input
      const input = document.getElementById('insurance-file-input') as HTMLInputElement
      if (input) input.value = ''

      // IMPORTANT: Don't call onUpload again - this was causing duplicate uploads
      // Instead, just trigger a page refresh to show the new document
      window.location.reload()
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const isFormValid = selectedFile && fileErrors.length === 0

  return (
    <div className="space-y-4 py-4">
      {/* Show existing uploads */}
      {existing.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Uploaded Insurance Certificates:</h3>
          {existing.map(doc => (
            <div key={doc.id} className="flex items-center space-x-4 p-3 border rounded-md bg-gray-50">
              <div className="flex-1">
                <p className="text-sm font-medium">Insurance Certificate</p>
                <p className="text-xs text-gray-500 truncate">{doc.file_path.split('/').pop()}</p>
              </div>
              <a 
                href={doc.publicURL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Upload Success Message */}
      {uploadSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
          <div className="text-green-800 text-sm">
            <strong>✅ Document uploaded successfully!</strong>
            <p>Your insurance certificate has been uploaded.</p>
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="space-y-4 p-4 border rounded-md">
        <h3 className="text-sm font-medium text-gray-700">Upload Insurance Certificate</h3>
        
        {/* File Upload */}
        <div>
          <label htmlFor="insurance-file-input" className="block text-sm font-medium text-gray-700 mb-2">
            Upload Document (Max 5.0MB)
          </label>
          <input
            id="insurance-file-input"
            type="file"
            onChange={handleFileSelection}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            disabled={uploading}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-medium
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* File Validation Errors */}
        {fileErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-red-800 text-sm">
              <strong>File Validation Failed:</strong>
              <ul className="mt-1 list-disc list-inside">
                {fileErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* File Validation Success */}
        {selectedFile && fileErrors.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="text-green-800 text-sm">
              <strong>✅ File validated successfully:</strong>
              <p className="mt-1">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)</p>
            </div>
          </div>
        )}

        {/* Single Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!isFormValid || uploading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading Insurance...
            </span>
          ) : (
            'Upload Insurance Certificate'
          )}
        </button>

        {/* Form Validation Help */}
        {!isFormValid && selectedFile && (
          <div className="text-sm text-gray-600">
            <p>Please fix validation errors to upload</p>
          </div>
        )}
      </div>
    </div>
  )
} 