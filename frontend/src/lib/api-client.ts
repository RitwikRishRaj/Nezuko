import { useAuth } from '@clerk/nextjs';
import { buildApiUrl } from './api-config';

// API Client with authentication
export class ApiClient {
  private getToken: () => Promise<string | null>;

  constructor(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async get(endpoint: string, params?: Record<string, string>): Promise<Response> {
    const url = new URL(buildApiUrl(endpoint));
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return this.fetchWithRetry(url.toString(), {
      method: 'GET',
      headers: await this.getHeaders(),
    });
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
    try {
      const response = await fetch(url, options);
      
      // If it's a 503 (service unavailable) and suggests retry, wait and retry
      if (response.status === 503 && retries > 0) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.retryAfter) {
          await new Promise(resolve => setTimeout(resolve, errorData.retryAfter * 1000));
          return this.fetchWithRetry(url, options, retries - 1);
        }
      }
      
      return response;
    } catch (error) {
      // Retry on network errors if retries left
      if (retries > 0 && (error instanceof TypeError || error.message.includes('fetch'))) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  async post(endpoint: string, data?: any): Promise<Response> {
    return this.fetchWithRetry(buildApiUrl(endpoint), {
      method: 'POST',
      headers: await this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any): Promise<Response> {
    return fetch(buildApiUrl(endpoint), {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string): Promise<Response> {
    return fetch(buildApiUrl(endpoint), {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });
  }
}

// Hook to get API client with authentication
export function useApiClient(): ApiClient {
  const { getToken } = useAuth();
  return new ApiClient(getToken);
}

// Server-side API client (for API routes that still exist)
export async function createServerApiClient(getToken: () => Promise<string | null>): Promise<ApiClient> {
  return new ApiClient(getToken);
}