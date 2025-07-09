'use client';

import { useState } from 'react';
import { UrlShortenerForm } from '@/components/url-shortener-form';
import { UrlList } from '@/components/url-list';
import { UserMenu } from '@/components/auth/user-menu';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUrlCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-end mb-4">
          <UserMenu />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            URL Shortener
          </h1>
          <p className="text-muted-foreground text-lg">
            Transform long URLs into short, memorable links
          </p>
        </div>

        <div className="space-y-8">
          <UrlShortenerForm onUrlCreated={handleUrlCreated} />
          <UrlList refreshTrigger={refreshTrigger} />
        </div>

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Built with Next.js, NestJS, and Supabase</p>
        </footer>
      </div>
    </main>
  );
}