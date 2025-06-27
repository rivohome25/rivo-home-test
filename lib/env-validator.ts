/**
 * @file env-validator.ts
 * @description Validates required environment variables at startup
 */

const REQUIRED_ENV_VARS = {
  // Critical variables required for basic functionality
  critical: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ],
  
  // Important but not critical for basic functionality  
  important: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLIC_KEY',
    'STRIPE_SECRET_KEY'
  ],
  
  // Optional variables
  optional: [
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'MAILCHIMP_API_KEY',
    'MAILCHIMP_LIST_ID',
    'MAILCHIMP_SERVER',
    'REDIS_URL',
    'UPSTASH_REDIS_REST_URL'
  ]
};

/**
 * Gets environment variable value, handling both server and client contexts
 */
function getEnvVar(name: string): string | undefined {
  // For client-side, only NEXT_PUBLIC_ variables are available
  if (typeof window !== 'undefined') {
    // We're on the client side
    if (name.startsWith('NEXT_PUBLIC_')) {
      return process.env[name];
    } else {
      // Client can't access server-only env vars, so we skip them
      return undefined;
    }
  } else {
    // We're on the server side, all env vars available
    return process.env[name];
  }
}

/**
 * Main validation function expected by SecurityProvider
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  return validateEnvironmentVariables();
}

/**
 * Validates that all required environment variables are set
 */
export function validateEnvironmentVariables(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isClientSide = typeof window !== 'undefined';
  
  // Check critical variables - these must be present
  REQUIRED_ENV_VARS.critical.forEach(varName => {
    const value = getEnvVar(varName);
    if (!value) {
      errors.push(`Missing critical environment variable: ${varName}`);
    }
  });
  
  // Check important variables - warn but don't fail
  // On client side, skip server-only variables
  REQUIRED_ENV_VARS.important.forEach(varName => {
    if (isClientSide && !varName.startsWith('NEXT_PUBLIC_')) {
      // Skip server-only variables when validating on client
      return;
    }
    
    const value = getEnvVar(varName);
    if (!value) {
      warnings.push(`Missing important environment variable: ${varName}`);
    }
  });
  
  // Log warnings but don't fail validation
  if (warnings.length > 0) {
    console.warn('⚠️ Environment warnings:', warnings);
  }
  
  // Validate URL format for critical URLs
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  if (supabaseUrl && !isValidUrl(supabaseUrl)) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
  }
  
  // Validate Supabase key format
  const supabaseKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (supabaseKey && !supabaseKey.startsWith('eyJ')) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (should start with eyJ)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Masks sensitive environment variable for logging
 */
export function maskSensitiveValue(value: string): string {
  if (!value || value.length < 8) return '[REDACTED]';
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}

/**
 * Logs environment status (safe for production)
 */
export function logEnvironmentStatus(): void {
  const validation = validateEnvironmentVariables();
  
  if (validation.isValid) {
    console.log('✅ Environment variables validated successfully');
  } else {
    console.error('❌ Environment validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Invalid environment configuration');
  }
  
  // Log configuration status (without exposing values)
  console.log('🔧 Environment configuration:');
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  const stripeKey = getEnvVar('STRIPE_SECRET_KEY');
  const mailchimpKey = getEnvVar('MAILCHIMP_API_KEY');
  
  console.log(`  - Supabase URL: ${supabaseUrl ? maskSensitiveValue(supabaseUrl) : 'Not configured'}`);
  console.log(`  - Stripe configured: ${stripeKey ? 'Yes' : 'No'}`);
  console.log(`  - Mailchimp configured: ${mailchimpKey ? 'Yes' : 'No'}`);
}
