'use client'

import { useState } from 'react'

interface LicenseUploaderProps {
  onUpload: (file: File, licenseNumber: string, issuingState: string) => void
  existing: Array<{
    id: string
    publicURL?: string
    license_number?: string
    issuing_state?: string
    uploaded_at: string
  }>
  loading: boolean
}

export function LicenseUploader({ onUpload, existing, loading }: LicenseUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [licenseNumber, setLicenseNumber] = useState('')
  const [issuingState, setIssuingState] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF, JPEG, or PNG file')
        setFile(null)
        return
      }
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        setFile(null)
        return
      }
      
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a file')
      return
    }
    
    if (!licenseNumber.trim()) {
      setError('License number is required')
      return
    }
    
    if (!issuingState.trim()) {
      setError('Issuing state is required')
      return
    }
    
    // Call the parent component's upload handler
    onUpload(file, licenseNumber, issuingState)
    
    // Reset form
    setFile(null)
    setLicenseNumber('')
    setIssuingState('')
    
    // Reset the file input
    const fileInput = document.getElementById('license-file') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <div className="mt-2 space-y-4">
      {/* Display existing licenses */}
      {existing && existing.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm font-medium mb-2">Uploaded Licenses:</h3>
          <ul className="space-y-2">
            {existing.map((doc) => (
              <li key={doc.id} className="text-sm border-l-2 border-green-500 pl-3">
                <a 
                  href={doc.publicURL} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-600 hover:underline"
                >
                  View License
                </a>
                <div className="text-gray-600">
                  License #: {doc.license_number || 'N/A'}
                </div>
                <div className="text-gray-600">
                  State: {doc.issuing_state || 'N/A'}
                </div>
                <div className="text-gray-500 text-xs">
                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <div>
          <label htmlFor="license-file" className="block text-sm font-medium text-gray-700">
            Upload License Document (PDF, JPEG, PNG)
          </label>
          <input
            id="license-file"
            type="file"
            onChange={handleFileChange}
            disabled={loading}
            accept=".pdf,.jpg,.jpeg,.png"
            className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
          />
          {file && (
            <p className="mt-1 text-sm text-gray-500">
              Selected file: {file.name}
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="license-number" className="block text-sm font-medium text-gray-700">
            License Number
          </label>
          <input
            id="license-number"
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            disabled={loading}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                       focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="issuing-state" className="block text-sm font-medium text-gray-700">
            Issuing State/Province
          </label>
          <input
            id="issuing-state"
            type="text"
            value={issuingState}
            onChange={(e) => setIssuingState(e.target.value)}
            disabled={loading}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                       focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !file}
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white 
                     bg-blue-600 border border-transparent rounded-md shadow-sm 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload License'}
        </button>
      </form>
    </div>
  )
} 