/**
 * @file secure-logger.ts
 * @description Secure logging utility that prevents credential exposure
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  sanitizedData?: any;
}

// Patterns to detect and redact sensitive information
const SENSITIVE_PATTERNS = [
  /sk_[a-zA-Z0-9_]{24,}/g,  // Stripe secret keys
  /pk_[a-zA-Z0-9_]{24,}/g,  // Stripe public keys
  /eyJ[A-Za-z0-9+/=]+/g,    // JWT tokens / Supabase keys
  /[a-f0-9]{32,}/g,         // API keys (hex format)
  /password["']?:\s*["'][^"']+["']/gi, // Password fields
  /token["']?:\s*["'][^"']+["']/gi,    // Token fields
];

/**
 * Sanitizes data by removing or masking sensitive information
 */
function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    let sanitized = data;
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    return sanitized;
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      // Check if key contains sensitive information
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('password') || 
          lowerKey.includes('secret') || 
          lowerKey.includes('key') || 
          lowerKey.includes('token')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    
    return sanitized;
  }
  
  return data;
}

/**
 * Secure logger class
 */
export class SecureLogger {
  private static instance: SecureLogger;
  
  private constructor() {}
  
  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }
  
  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString()
    };
    
    if (data) {
      entry.sanitizedData = sanitizeData(data);
    }
    
    // Use appropriate console method
    const logMethod = console[level] || console.log;
    
    if (entry.sanitizedData) {
      logMethod(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`, entry.sanitizedData);
    } else {
      logMethod(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  }
  
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }
  
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }
  
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
  
  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data);
    }
  }
}

// Export singleton instance
export const logger = SecureLogger.getInstance();
