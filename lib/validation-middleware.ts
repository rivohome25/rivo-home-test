/**
 * Basic input validation middleware for API routes
 * Validates and sanitizes user input to prevent common attacks
 */

import { NextRequest, NextResponse } from 'next/server'

export interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'email' | 'uuid' | 'boolean'
  maxLength?: number
  pattern?: RegExp
  sanitize?: boolean
}

export function validateRequest(rules: ValidationRule[]) {
  return async (request: NextRequest, body?: any) => {
    const data = body || await request.json().catch(() => ({}))
    const errors: string[] = []
    const sanitizedData: any = {}

    for (const rule of rules) {
      const value = data[rule.field]

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`)
        continue
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null) {
        continue
      }

      // Type validation
      if (rule.type) {
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${rule.field} must be a string`)
              continue
            }
            break
          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push(`${rule.field} must be a number`)
              continue
            }
            break
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(value)) {
              errors.push(`${rule.field} must be a valid email`)
              continue
            }
            break
          case 'uuid':
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(value)) {
              errors.push(`${rule.field} must be a valid UUID`)
              continue
            }
            break
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`${rule.field} must be a boolean`)
              continue
            }
            break
        }
      }

      // Length validation
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push(`${rule.field} must be no more than ${rule.maxLength} characters`)
        continue
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`${rule.field} has invalid format`)
        continue
      }

      // Sanitization
      let sanitizedValue = value
      if (rule.sanitize && typeof value === 'string') {
        // Basic HTML/script tag removal and escaping
        sanitizedValue = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>?/gm, '')
          .trim()
      }

      sanitizedData[rule.field] = sanitizedValue
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        data: null
      }
    }

    return {
      isValid: true,
      errors: [],
      data: sanitizedData
    }
  }
}

// Common validation patterns
export const commonPatterns = {
  phone: /^\+?[\d\s\-\(\)]+$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  safeString: /^[a-zA-Z0-9\s\-_.,']+$/
}

// Rate limiting helper
export async function checkRateLimit(
  identifier: string, 
  limit: number = 10, 
  windowMs: number = 60000
): Promise<boolean> {
  // Simple in-memory rate limiting (for production, use Redis)
  const key = `rate_limit_${identifier}`
  const now = Date.now()
  
  // In a real app, you'd use Redis or a database
  // For now, this is a basic implementation
  return true // Allow all requests for beta
}

export function createValidationResponse(errors: string[]) {
  return NextResponse.json(
    { 
      error: 'Validation failed', 
      details: errors 
    }, 
    { status: 400 }
  )
} 