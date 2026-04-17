'use client';

import { useUser } from '@clerk/nextjs';

export function useUserData() {
  const { user, isLoaded } = useUser();
  
  return { user, isLoaded };
}
