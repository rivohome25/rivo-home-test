#!/usr/bin/env node

/**
 * Development utility to clear authentication cache and provide rate limiting guidance
 */

console.log('🔧 Authentication Rate Limit Helper');
console.log('====================================');
console.log('');
console.log('If you\'re experiencing rate limiting on localhost:');
console.log('');
console.log('1. Clear browser storage:');
console.log('   - Open DevTools (F12)');
console.log('   - Go to Application tab');
console.log('   - Click "Clear storage" > "Clear site data"');
console.log('');
console.log('2. Wait 5 minutes for Supabase rate limit to reset');
console.log('');
console.log('3. Try signing in again');
console.log('');
console.log('4. If issues persist, check your Supabase dashboard:');
console.log('   - https://supabase.com/dashboard');
console.log('   - Go to Authentication > Settings');
console.log('   - Check rate limiting configuration');
console.log('');
console.log('5. Consider using incognito/private browsing for testing');
console.log('');
console.log('💡 This app has been optimized to reduce auth requests');
console.log('   and handle rate limiting gracefully.');
console.log('');

// If running in a browser context (unlikely but just in case)
if (typeof window !== 'undefined') {
  console.log('🧹 Clearing localStorage and sessionStorage...');
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Local storage cleared');
  } catch (e) {
    console.log('❌ Could not clear storage:', e.message);
  }
} 