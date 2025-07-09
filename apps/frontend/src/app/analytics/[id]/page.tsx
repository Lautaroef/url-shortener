'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, UrlAnalytics, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { ArrowLeft, Globe, Link2, Clock, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<UrlAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAnalytics = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }
    
    try {
      const id = parseInt(params.id as string);
      const data = await api.getUrlAnalytics(id);
      setAnalytics(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load analytics');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (error) return;

    const interval = setInterval(() => {
      fetchAnalytics(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [error, fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Failed to load analytics'}</p>
          <Button onClick={() => router.push('/')}>Go back</Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to URLs
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">URL Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Tracking performance and visitor insights
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Visits</p>
                <p className="text-3xl font-bold">{analytics.totalVisits}</p>
              </div>
              <Link2 className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Real-time Visits</p>
                <p className="text-3xl font-bold">{analytics.realtimeVisits}</p>
                <p className="text-xs text-gray-500 mt-1">Not yet synced</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unique Sources</p>
                <p className="text-3xl font-bold">
                  {analytics.recentVisits.length > 0 
                    ? new Set(analytics.recentVisits.map(v => v.referer || 'Direct')).size
                    : 0}
                </p>
              </div>
              <Globe className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Daily Visits Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Daily Visits (Last 7 Days including Today)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.visitsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Visits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Visits</h2>
          {analytics.recentVisits.length === 0 ? (
            <p className="text-gray-500">No visits yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Time</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Source</th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentVisits.map((visit, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 text-sm">
                        {formatFullDate(visit.visitedAt)}
                      </td>
                      <td className="py-2 px-4 text-sm">
                        {visit.referer ? (
                          <a
                            href={visit.referer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {new URL(visit.referer).hostname}
                          </a>
                        ) : (
                          <span className="text-gray-500">Direct</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-sm">
                        {visit.country || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}