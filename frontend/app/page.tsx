'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { LoginForm } from '@/components/LoginForm';
import { HomeView } from '@/components/home/HomeView';

export default function Home() {
  const { token, isLoading, isInitialized, verifyToken } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Verify token on mount if it exists
  useEffect(() => {
    if (mounted && isInitialized && token) {
      // Verify the token is still valid
      verifyToken().then((isValid) => {
        if (!isValid) {
          console.log('Token invalid, redirecting to login');
          router.push('/');
        }
      });
    }
  }, [mounted, isInitialized, token, verifyToken, router]);

  // Show loading state while mounting or initializing
  if (!mounted || !isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show login form if no token
  if (!token) {
    return <LoginForm />;
  }

  // Show home view if authenticated
  return <HomeView />;
}