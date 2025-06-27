"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { YouTubeEmbed, extractYouTubeId, getYouTubeThumbnail } from "@/components/ui/youtube-embed"
import { Button } from "@/components/ui/button"
import { SilentLoadingScreen } from "@/components/SilentLoadingScreen"
import HomeownerNavigationClient from "@/components/HomeownerNavigationClient"

const videos = [
  {
    id: 1,
    category: "Plumbing",
    link: "https://www.youtube.com/watch?v=_k6N3g_swog",
    fallbackTitle: "How to Fix a Running Toilet",
    fallbackDescription: "Learn how to fix a running toilet with these simple steps - a common household issue you can solve yourself.",
    thumbnail: "/placeholder-diy-plumbing.jpg", 
  },
  {
    id: 2,
    category: "Plumbing",
    link: "https://www.youtube.com/watch?v=7aXFqsI6PF0",
    fallbackTitle: "How to Fix a Dripping Faucet",
    fallbackDescription: "Stop that annoying drip and save water with this simple faucet repair guide.",
    thumbnail: "/placeholder-diy-plumbing.jpg",
  },
  {
    id: 3,
    category: "Electrical",
    link: "https://www.youtube.com/watch?v=OWuzt0tlLJg",
    fallbackTitle: "How to Install a Ceiling Fan",
    fallbackDescription: "Step-by-step guide to safely installing a ceiling fan in your home.",
    thumbnail: "/placeholder-diy-electrical.jpg",
  },
  {
    id: 4,
    category: "HVAC Maintenance",
    link: "https://www.youtube.com/watch?v=PFOFt7QiWsA",
    fallbackTitle: "Changing Air Filters Properly",
    fallbackDescription: "Learn the right way to change your home's air filters to improve air quality and HVAC efficiency.",
    thumbnail: "/placeholder-diy-seasonal.jpg",
  },
  {
    id: 5,
    category: "HVAC",
    link: "https://www.youtube.com/watch?v=d1m5G2eDGMo",
    fallbackTitle: "How to Install a Smart Thermostat",
    fallbackDescription: "Upgrade your home with a smart thermostat installation to save energy and improve comfort.",
    thumbnail: "/placeholder-diy-electrical.jpg",
  }
];

export default function DashboardDIYLibraryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredVideos, setFilteredVideos] = useState(videos);
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [videoData, setVideoData] = useState<Record<number, { title: string, description: string }>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Pre-extract video IDs to ensure they're valid
  const videoIds = videos.map(video => ({
    id: video.id,
    youtubeId: extractYouTubeId(video.link)
  }));

  // Fetch YouTube data for all videos
  useEffect(() => {
    const fetchVideoData = async () => {
      const newVideoData: Record<number, { title: string, description: string }> = {};
      
      for (const video of videos) {
        const youtubeId = videoIds.find(v => v.id === video.id)?.youtubeId;
        if (youtubeId) {
          try {
            const response = await fetch(`/api/youtube?videoId=${youtubeId}`);
            if (response.ok) {
              const data = await response.json();
              const title = data.title;
              // Generate a description from the title
              const description = `Learn ${title.toLowerCase()} with this step-by-step tutorial for DIY home maintenance.`;
              newVideoData[video.id] = { title, description };
            } else {
              // Use fallback values if API call fails
              newVideoData[video.id] = { 
                title: video.fallbackTitle, 
                description: video.fallbackDescription 
              };
            }
          } catch (error) {
            console.error(`Error fetching video data for ${youtubeId}:`, error);
            newVideoData[video.id] = { 
              title: video.fallbackTitle, 
              description: video.fallbackDescription 
            };
          }
        }
      }
      
      setVideoData(newVideoData);
      // Set loading to false once data is fetched
      setIsLoading(false);
    };
    
    fetchVideoData();
  }, []);

  // Filter videos based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredVideos(videos);
      return;
    }

    const search = searchTerm.toLowerCase();
    const results = videos.filter(
      video => {
        const title = videoData[video.id]?.title || video.fallbackTitle;
        const description = videoData[video.id]?.description || video.fallbackDescription;
        
        return title.toLowerCase().includes(search) || 
               description.toLowerCase().includes(search) ||
               video.category.toLowerCase().includes(search);
      }
    );
    
    setFilteredVideos(results);
  }, [searchTerm, videoData]);

  const handlePlayVideo = (videoId: number) => {
    setActiveVideo(videoId);
  };

  const handleImageError = (videoId: number) => {
    setImageError(prev => ({ ...prev, [videoId]: true }));
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SilentLoadingScreen isLoading={isLoading} />
      
      <HomeownerNavigationClient 
        title="DIY Home Maintenance Library" 
        currentPage="diy-library"
      />
      
      <div className="rivo-card p-6 mb-8">
        <div className="max-w-xl">
          <p className="text-lg text-gray-700 mb-6">
            Access our collection of step-by-step guides, videos, and resources to tackle home maintenance projects with confidence.
          </p>
          
          {/* Search input */}
          <div>
            <Input
              type="search"
              placeholder="Search for videos..."
              className="border focus-visible:ring-2 focus-visible:ring-rivo-dark"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* DIY Videos Section */}
      <div className="rivo-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Available DIY Videos</h2>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600 mb-4">No videos found matching "{searchTerm}"</p>
            <Button onClick={() => setSearchTerm("")} variant="outline">Clear Search</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video, index) => {
              const youtubeId = videoIds.find(v => v.id === video.id)?.youtubeId;
              // Use YouTube thumbnail or fall back to placeholder if YouTube thumbnail fails to load
              const thumbnailUrl = imageError[video.id] 
                ? video.thumbnail 
                : getYouTubeThumbnail(youtubeId, 'high');
              
              // Get real title and description
              const title = videoData[video.id]?.title || video.fallbackTitle;
              const description = videoData[video.id]?.description || video.fallbackDescription;
              
              return (
                <div key={video.id} className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                  {/* Video Thumbnail Section - Fixed Height */}
                  <div className="relative h-48 flex-shrink-0">
                    {activeVideo === video.id && youtubeId ? (
                      <div className="absolute inset-0">
                        <YouTubeEmbed 
                          videoId={youtubeId} 
                          title={title}
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <>
                        <Image
                          src={thumbnailUrl}
                          alt={title}
                          fill
                          className="object-cover"
                          onError={() => handleImageError(video.id)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            onClick={() => handlePlayVideo(video.id)}
                            className="bg-white text-black hover:bg-gray-100 rounded-full p-3"
                            size="sm"
                          >
                            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 5v10l8-5-8-5z"/>
                            </svg>
                          </Button>
                        </div>
                        <div className="absolute top-2 left-2">
                          <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            {video.category}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Content Section - Flexible Height */}
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                      {title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
                      {description}
                    </p>
                    
                    {/* Action Button - Always at bottom */}
                    <div className="mt-auto">
                      {activeVideo === video.id ? (
                        <Button
                          onClick={() => setActiveVideo(null)}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          Close Video
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePlayVideo(video.id)}
                          className="w-full bg-rivo-base hover:bg-rivo-dark text-white"
                          size="sm"
                        >
                          Watch Tutorial
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div></div>
  );
} 