import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Security utility functions
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>&'"]/g, (match) => {
      switch (match) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return match;
      }
    });
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Add a validation hook for form fields
export function validateFormField(name: string, value: string, required: boolean = false): string | null {
  // Empty check for required fields
  if (required && !value.trim()) {
    return `${name} is required`;
  }

  // Email validation
  if (name.toLowerCase().includes('email') && value.trim() && !isValidEmail(value)) {
    return 'Please enter a valid email address';
  }

  // Phone validation (basic)
  if (name.toLowerCase().includes('phone') && value.trim()) {
    const phoneRegex = /^[0-9+\-() ]{6,20}$/; // Simple check for phone-like pattern
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid phone number';
    }
  }

  return null; // No error
}
