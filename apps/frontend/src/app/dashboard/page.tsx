'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, UserAnalytics, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
import { BarChart3, Link2, MousePointerClick, TrendingUp, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/');
      return;
    }

    fetchAnalytics();
  }, [user, authLoading, router]);

  const fetchAnalytics = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }
    
    try {
      const data = await api.getUserAnalytics();
      setAnalytics(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!user || error) return;

    const interval = setInterval(() => {
      fetchAnalytics(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [user, error, fetchAnalytics]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Failed to load dashboard'}</p>
          <Button onClick={() => router.push('/')}>Go back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              ← Back to URLs
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Overview of your URL shortener performance
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Last updated: {formatDistanceToNow(lastRefresh)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAnalytics(true)}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total URLs</p>
                <p className="text-3xl font-bold">{analytics.totalUrls}</p>
              </div>
              <Link2 className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Clicks</p>
                <p className="text-3xl font-bold">{analytics.totalVisits}</p>
              </div>
              <MousePointerClick className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Clicks/URL</p>
                <p className="text-3xl font-bold">
                  {analytics.totalUrls > 0 
                    ? (analytics.totalVisits / analytics.totalUrls).toFixed(1)
                    : '0'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Click Rate</p>
                <p className="text-3xl font-bold">
                  {analytics.totalUrls > 0 
                    ? `${((analytics.totalVisits / (analytics.totalUrls * 100)) * 100).toFixed(0)}%`
                    : '0%'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Recent URLs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Top Performing URLs</h2>
          {analytics.recentUrls.length === 0 ? (
            <p className="text-gray-500">No URLs created yet</p>
          ) : (
            <div className="space-y-4">
              {analytics.recentUrls.map((url) => (
                <div
                  key={url.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono text-sm text-blue-600">/{url.shortCode}</p>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(url.createdAt))}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate max-w-lg">
                      {url.originalUrl}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-semibold">{url.visits}</p>
                      <p className="text-xs text-gray-500">clicks</p>
                    </div>
                    
                    <Link href={`/analytics/${url.id}`}>
                      <Button variant="outline" size="sm">
                        View Analytics
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <Link href="/">
            <Button>Create New URL</Button>
          </Link>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
}