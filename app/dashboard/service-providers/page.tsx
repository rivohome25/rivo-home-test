'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServiceProvidersPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the correct find-providers page
    router.replace('/dashboard/find-providers');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <p className="text-gray-600">Redirecting to Find Providers...</p>
    </div>
  );
} 