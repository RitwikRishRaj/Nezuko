'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useApiClient } from '@/lib/api-client';
import { API_CONFIG } from '@/lib/api-config';

export function RatingUpdater() {
  const { user, isLoaded } = useUser();
  const apiClient = useApiClient();
  const hasUpdated = useRef(false);

  useEffect(() => {
    // Only run once when user is loaded and we haven't updated yet
    if (!isLoaded || !user || hasUpdated.current) {
      return;
    }

    const updateRating = async () => {
      try {
        const response = await apiClient.post(API_CONFIG.ENDPOINTS.USER.UPDATE_RATING);

        if (response.ok) {
          let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse rating update response:', jsonError);
          throw new Error('Server returned invalid response');
        }
          
          if (data.updated) {
            // Rating changed - show notification
            const ratingChange = data.rating - (data.previousRating || 0);
            const changeText = ratingChange > 0 
              ? `+${ratingChange}` 
              : `${ratingChange}`;
            
            toast.success('Rating Updated!', {
              description: `${data.previousRating || 'N/A'} → ${data.rating} (${changeText})`,
              duration: 5000,
            });
            
            console.log('Rating updated:', data.previousRating, '→', data.rating);
          } else {
            // Rating unchanged - silent
            console.log('Rating unchanged:', data.rating);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Failed to update rating:', errorData.error || response.statusText);
          
          // Only show error toast if it's not a connection issue (which might be expected during development)
          if (response.status !== 503) {
            toast.error('Failed to update rating', {
              description: errorData.error || 'Please try again later',
              duration: 3000,
            });
          }
        }
      } catch (error) {
        console.error('Error updating rating:', error);
        
        // Check if it's a connection error (backend not running)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isConnectionError = errorMessage.includes('fetch failed') || 
                                  errorMessage.includes('ECONNREFUSED') ||
                                  errorMessage.includes('Failed to fetch');
        
        if (!isConnectionError) {
          toast.error('Error updating rating', {
            description: 'Please check your connection and try again',
            duration: 3000,
          });
        }
      }
    };

    hasUpdated.current = true;
    updateRating();
  }, [user, isLoaded, apiClient]);

  return null; // This component doesn't render anything
}
