"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { WaitlistCTASection } from "@/components/waitlist-cta-section"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { YouTubeEmbed, extractYouTubeId, getYouTubeThumbnail } from "@/components/ui/youtube-embed"
import { Button } from "@/components/ui/button"
import { SilentLoadingScreen } from "@/components/SilentLoadingScreen"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { getUserPlan } from '@/lib/getUserPlan'
import { Lock, Crown } from 'lucide-react'
import type { Metadata } from "next"

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

export default function DIYLibraryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredVideos, setFilteredVideos] = useState(videos);
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [videoData, setVideoData] = useState<Record<number, { title: string, description: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const supabase = createClientComponentClient();

  // Check user authentication and plan
  useEffect(() => {
    async function checkUserAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const plan = await getUserPlan();
          setUserPlan(plan);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setAuthLoading(false);
      }
    }
    
    checkUserAuth();
  }, [supabase]);

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

  // Show login prompt for non-authenticated users
  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SilentLoadingScreen isLoading={true} />
        <Navbar />
        <main className="flex-1"></main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative bg-gradient-to-r from-rivo-light via-rivo-base to-rivo-dark py-24 md:py-32 text-center">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  DIY Home Maintenance Library
                </h1>
                <p className="text-xl text-white/90 mb-8">
                  Access our collection of step-by-step guides, videos, and resources to tackle home maintenance projects with confidence.
                </p>
              </div>
            </div>
          </section>

          {/* Access Restricted Section */}
          <section className="py-16 md:py-24">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="max-w-2xl mx-auto text-center">
                <div className="bg-white rounded-lg shadow-lg p-8 border">
                  <Lock className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Sign In to Access DIY Library
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Create a free account to access our complete library of DIY maintenance videos and guides. 
                    Start with our Free plan and upgrade anytime for additional features.
                  </p>
                  <div className="space-y-4">
                    <Link href="/sign-in" className="inline-block">
                      <Button size="lg" className="bg-rivo-base hover:bg-rivo-dark">
                        Sign In to Continue
                      </Button>
                    </Link>
                    <p className="text-sm text-gray-500">
                      Don't have an account? <Link href="/sign-up" className="text-rivo-base hover:underline">Sign up free</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SilentLoadingScreen isLoading={isLoading} />
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-rivo-light via-rivo-base to-rivo-dark py-24 md:py-32 text-center">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  DIY Home Maintenance Library
                </h1>
                {userPlan && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full">
                    {userPlan.name === 'Premium' && <Crown className="w-4 h-4 text-yellow-300" />}
                    <span className="text-sm text-white font-medium">{userPlan.name} Plan</span>
                  </div>
                )}
              </div>
              <p className="text-xl text-white/90 mb-8">
                Access our collection of step-by-step guides, videos, and resources to tackle home maintenance projects with confidence.
              </p>
              
              {/* Search input */}
              <div className="max-w-md mx-auto">
                <Input
                  type="search"
                  placeholder="Search for videos..."
                  className="bg-white/95 border-0 focus-visible:ring-2 focus-visible:ring-rivo-dark"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white to-transparent"></div>
        </section>

        {/* DIY Videos Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore DIY Videos</h2>
              <p className="text-lg text-gray-600">
                Watch these helpful tutorials to learn how to maintain your home like a pro.
              </p>
            </div>

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
                              className="h-full"
                            />
                            <button 
                              onClick={() => setActiveVideo(null)}
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
                              priority={index < 4} // Prioritize loading the first four thumbnails
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
                            <Button 
                              onClick={() => setActiveVideo(null)}
                              variant="outline"
                              className="w-full border-rivo-base text-rivo-base hover:bg-rivo-base hover:text-white transition-colors"
                            >
                              Close Player
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handlePlayVideo(video.id)}
                              variant="outline" 
                              className="w-full border-rivo-base text-rivo-base hover:bg-rivo-base hover:text-white transition-colors"
                            >
                              Watch Video
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Categories Section (Upcoming) */}
        <section className="py-16 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon: Categorized Resources</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                We're expanding our DIY library with categorized resources, printable guides, and seasonal maintenance checklists.
              </p>
            </div>
          </div>
        </section>

        {/* Get Notified Section */}
        <WaitlistCTASection />
      </main>
      <Footer />
    </div>
  )
} 