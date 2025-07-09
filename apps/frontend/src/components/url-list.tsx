'use client';

import { useState, useEffect } from 'react';
import { Copy, Trash2, ExternalLink, Loader2, BarChart } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type Url } from '@/lib/api';

interface UrlListProps {
  refreshTrigger?: number;
}

export function UrlList({ refreshTrigger }: UrlListProps) {
  const [urls, setUrls] = useState<Url[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchUrls = async () => {
    try {
      const data = await api.getUrls();
      setUrls(data);
    } catch (error) {
      toast.error('Failed to load URLs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, [refreshTrigger]);

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api.deleteUrl(id);
      setUrls(urls.filter(url => url.id !== id));
      toast.success('URL deleted successfully');
    } catch (error) {
      toast.error('Failed to delete URL');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (urls.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No shortened URLs yet. Create your first one above!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your URLs</CardTitle>
        <CardDescription>
          Manage your shortened URLs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {urls.map((url) => (
            <div
              key={url.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg space-y-2 sm:space-y-0"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <a
                    href={url.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {url.shortUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(url.shortUrl)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground truncate max-w-md">
                  {url.originalUrl}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Created {format(new Date(url.createdAt), 'MMM d, yyyy')}</span>
                  {url.visits !== undefined && (
                    <>
                      <span>•</span>
                      <span className="font-medium">{url.visits} clicks</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.href = `/analytics/${url.id}`}
                  className="gap-2"
                >
                  <BarChart className="h-4 w-4" />
                  Analytics
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(url.id)}
                  disabled={deletingId === url.id}
                >
                  {deletingId === url.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}