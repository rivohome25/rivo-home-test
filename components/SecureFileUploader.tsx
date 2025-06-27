/**
 * @file SecureFileUploader.tsx
 * @description Secure file upload component with validation
 */

'use client';

import { useState } from 'react';
import { validateUploadedFile } from '@/lib/secure-file-validation';

interface SecureFileUploaderProps {
  onUpload: (file: File, sanitizedName: string) => Promise<void>;
  acceptedTypes?: string[];
  maxSize?: number;
  disabled?: boolean;
}

export default function SecureFileUploader({
  onUpload,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.doc', '.docx'],
  maxSize = 10 * 1024 * 1024,
  disabled = false
}: SecureFileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);

    try {
      // Validate file security
      const validation = await validateUploadedFile(selectedFile, maxSize);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        setFile(null);
        return;
      }

      console.log('File validation passed:', validation.sanitizedName);
      
    } catch (error) {
      console.error('File validation error:', error);
      setErrors(['Failed to validate file. Please try again.']);
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setErrors([]);

    try {
      // Re-validate before upload
      const validation = await validateUploadedFile(file, maxSize);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      await onUpload(file, validation.sanitizedName);
      
      // Reset form on success
      setFile(null);
      const input = document.getElementById('secure-file-input') as HTMLInputElement;
      if (input) input.value = '';
      
    } catch (error) {
      console.error('Upload error:', error);
      setErrors(['Upload failed. Please try again.']);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-red-800 text-sm">
            <strong>Security Validation Failed:</strong>
            <ul className="mt-1 list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* File Input */}
      <div>
        <label htmlFor="secure-file-input" className="block text-sm font-medium text-gray-700 mb-2">
          Upload Document (Max {(maxSize / 1024 / 1024).toFixed(1)}MB)
        </label>
        <input
          id="secure-file-input"
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          disabled={disabled || uploading}
          className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-medium
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* File Info */}
      {file && errors.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="text-green-800 text-sm">
            <strong>✅ File validated successfully:</strong>
            <p className="mt-1">{file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)</p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || errors.length > 0 || uploading || disabled}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md 
                   hover:bg-blue-700 focus:outline-none focus:ring-2 
                   focus:ring-blue-500 focus:ring-offset-2 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
      >
        {uploading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </span>
        ) : (
          'Upload Secure File'
        )}
      </button>
    </div>
  );
}
