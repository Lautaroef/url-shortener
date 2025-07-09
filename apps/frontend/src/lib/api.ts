import { createClient } from './supabase/client';

// Base API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Response types
export interface Url {
  id: number;
  shortCode: string;
  originalUrl: string;
  shortUrl: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  visits?: number;
}

export interface CreateUrlDto {
  originalUrl: string;
  customSlug?: string;
}

export interface UpdateUrlDto {
  customSlug: string;
}

// Error handling
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  return headers;
}

// API client
export const api = {
  async createUrl(data: CreateUrlDto): Promise<Url> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/urls`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create URL' }));
      throw new ApiError(response.status, error.message || 'Failed to create URL');
    }

    return response.json();
  },

  async getUrls(): Promise<Url[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/urls`, {
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to fetch URLs');
    }

    return response.json();
  },

  async getUrl(id: number): Promise<Url> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/urls/${id}`, {
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'URL not found');
    }

    return response.json();
  },

  async updateUrl(id: number, data: UpdateUrlDto): Promise<Url> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/urls/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update URL' }));
      throw new ApiError(response.status, error.message || 'Failed to update URL');
    }

    return response.json();
  },

  async deleteUrl(id: number): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/urls/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to delete URL');
    }
  },

  async getUrlAnalytics(id: number): Promise<UrlAnalytics> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/analytics/url/${id}`, {
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to fetch analytics');
    }

    return response.json();
  },

  async getUserAnalytics(): Promise<UserAnalytics> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/analytics/user`, {
      headers,
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to fetch user analytics');
    }

    return response.json();
  },
};

// Analytics types
export interface UrlAnalytics {
  totalVisits: number;
  realtimeVisits: number;
  recentVisits: {
    visitedAt: string;
    country: string | null;
    referer: string | null;
  }[];
  visitsByDay: {
    date: string;
    visits: number;
  }[];
}

export interface UserAnalytics {
  totalUrls: number;
  totalVisits: number;
  recentUrls: {
    id: number;
    shortCode: string;
    originalUrl: string;
    createdAt: string;
    visits: number;
  }[];
}