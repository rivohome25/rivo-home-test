import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { PersistentCache } from '@/lib/persistent-cache';

// Create a persistent cache instance for YouTube data
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const youtubeCache = new PersistentCache('youtube-data');

/**
 * Validates a YouTube video ID
 * @param videoId The YouTube video ID to validate
 * @returns True if the video ID is valid, false otherwise
 */
function isValidYouTubeVideoId(videoId: string): boolean {
  // YouTube video IDs are 11 characters, consisting of alphanumeric characters, dash, and underscore
  const youtubeIdRegex = /^[a-zA-Z0-9_-]{11}$/;
  return youtubeIdRegex.test(videoId);
}

export async function GET(request: NextRequest) {
  // Apply rate limiting: 60 requests per minute
  const rateLimitResult = rateLimit(request, { 
    limit: 60, 
    windowMs: 60 * 1000,
    message: 'Rate limit exceeded. Please try again in a minute.'
  });
  
  // If rate limit is exceeded, return the error response
  if (rateLimitResult) {
    return rateLimitResult;
  }
  
  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  
  // Validate input
  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }
  
  if (!isValidYouTubeVideoId(videoId)) {
    return NextResponse.json({ error: 'Invalid YouTube video ID format' }, { status: 400 });
  }
  
  // Check cache first
  const cachedData = youtubeCache.get<{ title: string, author: string, thumbnail: string }>(videoId);
  if (cachedData) {
    return NextResponse.json(cachedData);
  }
  
  try {
    // Get video info from YouTube oEmbed API (no API key required)
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate response data
    if (!data || !data.title) {
      throw new Error('Invalid response from YouTube API');
    }
    
    // Format the response
    const result = {
      title: data.title,
      author: data.author_name || 'Unknown',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
    
    // Cache the result
    youtubeCache.set(videoId, result, CACHE_DURATION);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return NextResponse.json({ error: 'Failed to fetch video data' }, { status: 500 });
  }
} 