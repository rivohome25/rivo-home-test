'use client'

import { useState } from 'react'

interface InsuranceUploaderProps {
  onUpload: (file: File) => void
  existing: Array<{
    id: string
    publicURL?: string
    uploaded_at: string
  }>
  loading: boolean
}

export function InsuranceUploader({ onUpload, existing, loading }: InsuranceUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
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
    
    // Call the parent component's upload handler
    onUpload(file)
    
    // Reset form
    setFile(null)
    
    // Reset the file input
    const fileInput = document.getElementById('insurance-file') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <div className="mt-2 space-y-4">
      {/* Display existing insurance certificates */}
      {existing && existing.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-md">
          <h3 className="text-sm font-medium mb-2">Uploaded Insurance Certificates:</h3>
          <ul className="space-y-2">
            {existing.map((doc) => (
              <li key={doc.id} className="text-sm border-l-2 border-green-500 pl-3">
                <a 
                  href={doc.publicURL} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-600 hover:underline"
                >
                  View Insurance Certificate
                </a>
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
          <label htmlFor="insurance-file" className="block text-sm font-medium text-gray-700">
            Upload Insurance Certificate (PDF, JPEG, PNG)
          </label>
          <input
            id="insurance-file"
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
        
        <button
          type="submit"
          disabled={loading || !file}
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white 
                     bg-blue-600 border border-transparent rounded-md shadow-sm 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload Insurance Certificate'}
        </button>
      </form>
    </div>
  )
} 