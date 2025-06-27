"use client"

import { motion } from "framer-motion"
import { PlayCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { YouTubeEmbed, extractYouTubeId, getYouTubeThumbnail } from "@/components/ui/youtube-embed"
import { useState, useEffect } from "react"
import { useYoutubeData } from "@/lib/use-youtube-data"

const videos = [
  {
    id: 1,
    category: "Plumbing",
    link: "https://www.youtube.com/watch?v=_k6N3g_swog",
    // Fallback info in case API fails
    fallbackTitle: "How to Fix a Running Toilet",
    fallbackDescription: "Learn how to fix a running toilet with these simple steps - a common household issue you can solve yourself.",
    thumbnail: "/placeholder-diy-plumbing.jpg", // Fallback image
  },
  {
    id: 2,
    category: "Plumbing",
    link: "https://www.youtube.com/watch?v=7aXFqsI6PF0",
    fallbackTitle: "How to Fix a Dripping Faucet",
    fallbackDescription: "Stop that annoying drip and save water with this simple faucet repair guide.",
    thumbnail: "/placeholder-diy-plumbing.jpg", // Fallback image
  },
  {
    id: 3,
    category: "Electrical",
    link: "https://www.youtube.com/watch?v=OWuzt0tlLJg",
    fallbackTitle: "How to Install a Ceiling Fan",
    fallbackDescription: "Step-by-step guide to safely installing a ceiling fan in your home.",
    thumbnail: "/placeholder-diy-electrical.jpg", // Fallback image
  },
  {
    id: 4,
    category: "HVAC Maintenance",
    link: "https://www.youtube.com/watch?v=PFOFt7QiWsA",
    fallbackTitle: "Changing Air Filters Properly",
    fallbackDescription: "Learn the right way to change your home's air filters to improve air quality and HVAC efficiency.",
    thumbnail: "/placeholder-diy-seasonal.jpg", // Fallback image
  },
  {
    id: 5,
    category: "HVAC",
    link: "https://www.youtube.com/watch?v=d1m5G2eDGMo",
    fallbackTitle: "How to Install a Smart Thermostat",
    fallbackDescription: "Upgrade your home with a smart thermostat installation to save energy and improve comfort.",
    thumbnail: "/placeholder-diy-electrical.jpg", // Fallback image
  }
];

export function DiyVideoPreview() {
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [videoData, setVideoData] = useState<Record<number, { title: string, description: string }>>({});

  const handlePlayVideo = (videoId: number) => {
    setActiveVideo(videoId);
  };

  const handleCloseVideo = () => {
    setActiveVideo(null);
  };

  const handleImageError = (videoId: number) => {
    setImageError(prev => ({ ...prev, [videoId]: true }));
  };

  // Pre-extract video IDs to ensure they're valid
  const videoIds = videos.map(video => ({
    id: video.id,
    youtubeId: extractYouTubeId(video.link)
  }));

  // Generate descriptions from titles
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
    };
    
    fetchVideoData();
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="container px-4 md:px-6 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-4">
            DIY Home Maintenance Videos
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn essential home maintenance skills with our expert-created video tutorials.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos.slice(0, 3).map((video, index) => {
            const youtubeId = videoIds.find(v => v.id === video.id)?.youtubeId || null;
            // Use YouTube thumbnail or fall back to placeholder if YouTube thumbnail fails to load
            const thumbnailUrl = imageError[video.id] 
              ? video.thumbnail 
              : getYouTubeThumbnail(youtubeId, 'high');
            
            // Get real title and description from our API, or fallback to original
            const title = videoData[video.id]?.title || video.fallbackTitle;
            const description = videoData[video.id]?.description || video.fallbackDescription;
            
            return (
              <motion.div 
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col h-full"
              >
                {/* Video Thumbnail Section - Fixed Height */}
                <div className="relative h-48 flex-shrink-0">
                  {activeVideo === video.id && youtubeId ? (
                    <div className="absolute inset-0">
                      <YouTubeEmbed 
                        videoId={youtubeId} 
                        title={title}
                        className="h-full"
                      />
                      <button 
                        onClick={handleCloseVideo}
                        className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full z-10 hover:bg-black/90 transition-colors"
                        aria-label="Close video"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <Image 
                        src={thumbnailUrl}
                        alt={title}
                        width={500}
                        height={300}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(video.id)}
                        priority={index < 2} // Prioritize loading the first two thumbnails
                      />
                      <button
                        onClick={() => handlePlayVideo(video.id)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        aria-label={`Play ${title}`}
                      >
                        <div className="bg-white/90 rounded-full p-3 transform group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-8 h-8 text-rivo-base" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </button>
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-rivo-base/90 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
                          {video.category}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Content Section - Flexible Height */}
                <div className="p-5 flex flex-col flex-grow">
                  {/* Title - Fixed Height */}
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem]">
                    {title}
                  </h3>
                  
                  {/* Description - Fixed Height */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow min-h-[4.5rem]">
                    {description}
                  </p>
                  
                  {/* Action Button - Fixed at Bottom */}
                  <div className="mt-auto">
                    {activeVideo === video.id ? (
                      <button 
                        onClick={handleCloseVideo}
                        className="w-full text-rivo-base font-medium hover:bg-rivo-base hover:text-white border border-rivo-base rounded-md py-2 px-4 transition-colors duration-200 inline-flex items-center justify-center"
                      >
                        Close Video
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handlePlayVideo(video.id)}
                        className="w-full text-rivo-base font-medium hover:bg-rivo-base hover:text-white border border-rivo-base rounded-md py-2 px-4 transition-colors duration-200 inline-flex items-center justify-center"
                      >
                        Watch Video 
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10"
        >
          <Link
            href="/resources/diy-library"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-rivo-base hover:bg-rivo-dark transition-colors duration-300"
          >
            View All DIY Videos
          </Link>
        </motion.div>
      </div>
    </section>
  )
} 