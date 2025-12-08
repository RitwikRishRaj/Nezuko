'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

export function RatingUpdater() {
  const { user, isLoaded } = useUser();
  const hasUpdated = useRef(false);

  useEffect(() => {
    // Only run once when user is loaded and we haven't updated yet
    if (!isLoaded || !user || hasUpdated.current) {
      return;
    }

    const updateRating = async () => {
      try {
        const response = await fetch('/api/user/update-rating', {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          
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
          console.error('Failed to update rating');
        }
      } catch (error) {
        console.error('Error updating rating:', error);
      }
    };

    hasUpdated.current = true;
    updateRating();
  }, [user, isLoaded]);

  return null; // This component doesn't render anything
}
