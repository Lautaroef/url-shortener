'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type CreateUrlDto } from '@/lib/api';

const urlSchema = z.object({
  originalUrl: z.string().url('Please enter a valid URL'),
  customSlug: z.string().optional(),
});

type FormData = z.infer<typeof urlSchema>;

interface UrlShortenerFormProps {
  onUrlCreated?: () => void;
}

export function UrlShortenerForm({ onUrlCreated }: UrlShortenerFormProps) {
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(urlSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Don't send customSlug if it's empty
      const payload: CreateUrlDto = {
        originalUrl: data.originalUrl,
        ...(data.customSlug && { customSlug: data.customSlug }),
      };
      
      const response = await api.createUrl(payload);
      setShortUrl(response.shortUrl);
      reset();
      toast.success('URL shortened successfully!');
      onUrlCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to shorten URL');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shortUrl) return;
    
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shorten Your URL</CardTitle>
        <CardDescription>
          Enter a long URL to create a shorter, shareable link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input
              {...register('originalUrl')}
              type="url"
              placeholder="https://example.com/very/long/url"
              disabled={isSubmitting}
            />
            {errors.originalUrl && (
              <p className="text-sm text-red-500">{errors.originalUrl.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Input
              {...register('customSlug')}
              placeholder="Custom slug (optional)"
              disabled={isSubmitting}
            />
            {errors.customSlug && (
              <p className="text-sm text-red-500">{errors.customSlug.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Shorten URL
          </Button>
        </form>

        {shortUrl && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your shortened URL:</p>
            <div className="flex items-center gap-2">
              <Input
                value={shortUrl}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}