"use client";

import { useEffect, useState } from "react";

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  className?: string;
  aspectRatio?: "16:9" | "4:3" | "1:1";
}

export function YouTubeEmbed({ 
  videoId, 
  title, 
  className = "", 
  aspectRatio = "16:9" 
}: YouTubeEmbedProps) {
  const [aspectRatioClass, setAspectRatioClass] = useState("pb-[56.25%]"); // Default 16:9
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Set the proper aspect ratio padding
    switch (aspectRatio) {
      case "4:3":
        setAspectRatioClass("pb-[75%]");
        break;
      case "1:1":
        setAspectRatioClass("pb-[100%]");
        break;
      default:
        setAspectRatioClass("pb-[56.25%]"); // 16:9
    }
  }, [aspectRatio]);

  // Reset state when videoId changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [videoId]);

  const handleIframeLoad = () => {
    setIsLoaded(true);
  };

  const handleIframeError = () => {
    setHasError(true);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`relative ${aspectRatioClass} bg-gray-100`}>
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-rivo-base border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Error loading video</p>
          </div>
        )}
        
        <iframe
          className={`absolute inset-0 w-full h-full rounded-lg shadow-md ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&enablejsapi=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        ></iframe>
      </div>
    </div>
  );
}

// Helper function to extract YouTube video ID from various URL formats
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  
  // Make sure the ID is exactly 11 characters
  if (match && match[7] && match[7].length === 11) {
    return match[7];
  }
  
  return null;
}

// Helper function to get YouTube thumbnail URL
export function getYouTubeThumbnail(videoId: string | null, quality: 'max' | 'high' | 'medium' | 'standard' | 'sd' = 'max'): string {
  if (!videoId) return '/placeholder-diy-plumbing.jpg'; // Fallback to placeholder
  
  const qualityMap = {
    max: 'maxresdefault.jpg',
    high: 'hqdefault.jpg',
    medium: 'mqdefault.jpg',
    standard: 'default.jpg',
    sd: 'sddefault.jpg'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
} 