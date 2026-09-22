'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCompletePage() {
  const router = useRouter();

  useEffect(() => {
    try {
      // Get the data from URL
      const urlParams = new URLSearchParams(window.location.search);
      const encodedData = urlParams.get('data');
      
      if (encodedData) {
        const decodedData = atob(encodedData);
        const userData = JSON.parse(decodedData);
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        router.replace('/dashboard');
      } else {
        router.replace('/login?error=no_auth_data');
      }
    } catch (error) {
      console.error('Error processing authentication data:', error);
      router.replace('/login?error=auth_processing_failed');
    }
  }, [router]);

  // Show a loading state while processing
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing authentication...</h1>
        <p>Please wait while we finish setting up your account.</p>
      </div>
    </div>
  );
}