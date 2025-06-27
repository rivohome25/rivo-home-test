/**
 * @file secure-file-validation.ts
 * @description Enterprise-grade file upload security validation
 */

// Browser-compatible path utilities
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase();
}

function getBaseName(fileName: string, ext: string): string {
  return fileName.slice(0, fileName.lastIndexOf(ext));
}

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
  let sanitized = fileName.replace(/\.\./g, '');
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove special characters that could cause issues
  sanitized = sanitized.replace(/[<>:"|\*\?]/g, '');
  
  // Ensure it doesn't start with special characters
  sanitized = sanitized.replace(/^[.\-_]+/, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = getFileExtension(sanitized);
    const name = getBaseName(sanitized, ext);
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
  const ext = getFileExtension(fileName);
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
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit (${(maxSize / 1024 / 1024).toFixed(2)}MB)`);
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
  return `attachment; filename="${sanitized}"; filename*=UTF-8''${encodeURIComponent(sanitized)}`;
}
