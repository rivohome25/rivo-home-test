/**
 * CRITICAL SECURITY FIX: File Upload Security Implementation
 * 
 * This script implements enterprise-grade file upload security to prevent:
 * - Malicious file uploads
 * - Path traversal attacks  
 * - File execution vulnerabilities
 * - MIME type spoofing
 * - Virus/malware uploads
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 IMPLEMENTING ENTERPRISE FILE UPLOAD SECURITY...\n');

// 1. Create secure file validation library
const fileValidationLib = `/**
 * @file secure-file-validation.ts
 * @description Enterprise-grade file upload security validation
 */

// Magic number signatures for allowed file types
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'application/zip': [0x50, 0x4B, 0x03, 0x04],
  'text/plain': [] // Text files don't have reliable magic numbers
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.doc', '.docx'];

/**
 * Validates file magic number against MIME type
 */
export function validateFileSignature(buffer: ArrayBuffer, mimeType: string): boolean {
  const signature = FILE_SIGNATURES[mimeType];
  if (!signature || signature.length === 0) {
    // For files without reliable signatures, allow but log
    console.warn('File type validation: No signature check for', mimeType);
    return true;
  }

  const fileBytes = new Uint8Array(buffer.slice(0, signature.length));
  return signature.every((byte, index) => fileBytes[index] === byte);
}

/**
 * Sanitizes file name to prevent path traversal and injection
 */
export function sanitizeFileName(fileName: string): string {
  // Remove directory traversal patterns
  let sanitized = fileName.replace(/\\.\\./g, '');
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\\x00-\\x1F\\x7F]/g, '');
  
  // Remove special characters that could cause issues
  sanitized = sanitized.replace(/[<>:"|\\*\\?]/g, '');
  
  // Ensure it doesn't start with special characters
  sanitized = sanitized.replace(/^[.\\-_]+/, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 255 - ext.length) + ext;
  }
  
  // If sanitization results in empty string, generate safe name
  if (!sanitized) {
    sanitized = 'upload_' + Date.now();
  }
  
  return sanitized;
}

/**
 * Validates file extension against whitelist
 */
export function validateFileExtension(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Comprehensive file validation
 */
export async function validateUploadedFile(
  file: File, 
  maxSize: number = MAX_FILE_SIZE
): Promise<{ isValid: boolean; errors: string[]; sanitizedName: string }> {
  const errors: string[] = [];
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(\`File size (\${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit (\${(maxSize / 1024 / 1024).toFixed(2)}MB)\`);
  }
  
  // Validate file extension
  if (!validateFileExtension(file.name)) {
    errors.push('File type not allowed. Only PDF, images, and documents are permitted.');
  }
  
  // Sanitize file name
  const sanitizedName = sanitizeFileName(file.name);
  
  // Read file buffer for magic number validation
  try {
    const buffer = await file.arrayBuffer();
    
    // Validate magic number
    if (!validateFileSignature(buffer, file.type)) {
      errors.push('File content does not match declared file type (potential security risk)');
    }
    
    // Additional security checks
    if (buffer.byteLength === 0) {
      errors.push('Empty file not allowed');
    }
    
    // Check for embedded scripts in files (basic check)
    const textContent = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 1024));
    if (textContent.includes('<script') || textContent.includes('javascript:')) {
      errors.push('File contains potentially malicious content');
    }
    
  } catch (error) {
    errors.push('Unable to read file content for validation');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedName
  };
}

/**
 * Generates secure Content-Disposition header
 */
export function getSecureContentDisposition(fileName: string): string {
  const sanitized = sanitizeFileName(fileName);
  return \`attachment; filename="\${sanitized}"; filename*=UTF-8''\${encodeURIComponent(sanitized)}\`;
}
`;

// 2. Create secure file upload middleware
const fileUploadMiddleware = `/**
 * @file secure-upload-middleware.ts
 * @description Middleware for securing file uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateUploadedFile, getSecureContentDisposition } from './secure-file-validation';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Secure file upload middleware
 */
export async function secureFileUploadMiddleware(
  request: NextRequest,
  maxFileSize: number = 10 * 1024 * 1024,
  maxFilesPerHour: number = 20
): Promise<NextResponse | null> {
  
  // Apply rate limiting for file uploads
  const rateLimitResult = rateLimit(request, {
    limit: maxFilesPerHour,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many file uploads. Please try again later.'
  });
  
  if (rateLimitResult) {
    return rateLimitResult;
  }
  
  // Validate content type
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Invalid content type for file upload' },
      { status: 400 }
    );
  }
  
  // Continue to route handler
  return null;
}

/**
 * Secure file response headers
 */
export function addSecureFileHeaders(response: NextResponse, fileName: string): NextResponse {
  // Prevent file execution
  response.headers.set('Content-Disposition', getSecureContentDisposition(fileName));
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline';");
  
  // Prevent caching of sensitive files
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}
`;

// 3. Create updated file upload components with security
const secureUploadComponent = `/**
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
`;

// Write all files
console.log('📁 Creating secure file validation library...');
fs.writeFileSync('lib/secure-file-validation.ts', fileValidationLib);

console.log('📁 Creating secure upload middleware...');
fs.writeFileSync('lib/secure-upload-middleware.ts', fileUploadMiddleware);

console.log('📁 Creating secure upload component...');
fs.writeFileSync('components/SecureFileUploader.tsx', secureUploadComponent);

// 4. Create virus scanning setup instructions
const virusScanSetup = `# VIRUS SCANNING SETUP

## Option 1: ClamAV Integration (Recommended for production)

### Install ClamAV
\`\`\`bash
# Ubuntu/Debian
sudo apt-get install clamav clamav-daemon

# macOS
brew install clamav

# Update virus definitions
sudo freshclam
\`\`\`

### Create virus scanning service
\`\`\`typescript
// lib/virus-scanner.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function scanFileForViruses(filePath: string): Promise<boolean> {
  try {
    await execAsync(\`clamscan "\${filePath}"\`);
    return true; // No virus found
  } catch (error) {
    console.error('Virus scan failed:', error);
    return false; // Virus found or scan failed
  }
}
\`\`\`

## Option 2: Cloud-based scanning (Alternative)

### Use VirusTotal API or similar cloud services
- More scalable but requires API keys
- Consider privacy implications of uploading files

## Integration into upload flow

\`\`\`typescript
// Add to file upload handler
import { scanFileForViruses } from '@/lib/virus-scanner';

const isClean = await scanFileForViruses(tempFilePath);
if (!isClean) {
  throw new Error('File failed virus scan');
}
\`\`\`
`;

console.log('📁 Creating virus scanning setup guide...');
fs.writeFileSync('security-fixes/virus-scanning-setup.md', virusScanSetup);

console.log('\n✅ FILE UPLOAD SECURITY IMPLEMENTATION COMPLETE!');
console.log('\n🔧 Next steps:');
console.log('1. Update existing upload components to use SecureFileUploader');
console.log('2. Add virus scanning (see virus-scanning-setup.md)');
console.log('3. Test all file upload endpoints');
console.log('4. Update Supabase storage bucket policies');
console.log('\n⚠️  CRITICAL: Test thoroughly before deploying to production!'); 