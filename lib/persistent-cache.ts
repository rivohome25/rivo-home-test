/**
 * @file persistent-cache.ts
 * @description File-based persistent cache utility
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

// Define the cache directory in the temporary directory
const CACHE_DIR = path.join(os.tmpdir(), 'rivohome-cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create cache directory:', error);
  }
}

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

/**
 * Persistent cache utility with file-based storage
 */
export class PersistentCache {
  private namespace: string;
  private cachePath: string;
  private memoryCache: Map<string, CacheEntry<any>>;
  
  /**
   * Constructor
   * @param namespace Namespace for this cache instance
   */
  constructor(namespace: string) {
    this.namespace = namespace;
    this.cachePath = path.join(CACHE_DIR, `${namespace}.json`);
    this.memoryCache = new Map();
    
    // Load cache from disk
    this.loadFromDisk();
  }
  
  /**
   * Load cache from disk
   */
  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.cachePath)) {
        const cacheData = JSON.parse(fs.readFileSync(this.cachePath, 'utf8'));
        
        // Convert the loaded object into a Map
        this.memoryCache = new Map(Object.entries(cacheData));
        
        // Clean expired entries
        this.cleanup();
      }
    } catch (error) {
      console.error(`Failed to load cache from disk for ${this.namespace}:`, error);
      // Initialize with empty cache on error
      this.memoryCache = new Map();
    }
  }
  
  /**
   * Save cache to disk
   */
  private saveToDisk(): void {
    try {
      // Convert Map to a plain object for JSON serialization
      const cacheObject = Object.fromEntries(this.memoryCache.entries());
      fs.writeFileSync(this.cachePath, JSON.stringify(cacheObject), 'utf8');
    } catch (error) {
      console.error(`Failed to save cache to disk for ${this.namespace}:`, error);
    }
  }
  
  /**
   * Clean up expired cache entries
   */
  private cleanup(): void {
    const now = Date.now();
    let hasExpired = false;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiry) {
        this.memoryCache.delete(key);
        hasExpired = true;
      }
    }
    
    // Save to disk if items were removed
    if (hasExpired) {
      this.saveToDisk();
    }
  }
  
  /**
   * Get an item from the cache
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    this.cleanup();
    
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Set an item in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttlMs Time to live in milliseconds
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    this.memoryCache.set(key, {
      data: value,
      expiry: Date.now() + ttlMs
    });
    
    this.saveToDisk();
  }
  
  /**
   * Delete an item from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.memoryCache.delete(key);
    this.saveToDisk();
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.memoryCache.clear();
    this.saveToDisk();
  }
} 