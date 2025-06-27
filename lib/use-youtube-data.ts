import { useState, useEffect } from 'react';

interface YoutubeData {
  title: string;
  author: string;
  thumbnail: string;
}

export function useYoutubeData(videoId: string | null) {
  const [data, setData] = useState<YoutubeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!videoId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/youtube?videoId=${videoId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch YouTube data');
        }
        const result = await response.json();
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Unknown error'));
        console.error('Error fetching YouTube data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [videoId]);

  return { data, isLoading, error };
} 