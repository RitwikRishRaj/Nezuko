// Server-side authentication utilities
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export interface UserProfile {
  id: string; // UUID (auto-generated)
  clerk_id: string; // Clerk user ID
  email: string;
  codeforces_handle: string;
  is_verified: boolean;
  codeforces_rating: number;
  current_rating: number;
  peak_rating: number;
  contests_participated: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current user's role from Clerk session claims
 * Returns 'admin' | 'user' | null
 */
export async function getUserRole(): Promise<'admin' | 'user' | null> {
  const { sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role as string | undefined;
  
  if (role === 'admin') return 'admin';
  if (sessionClaims?.userId) return 'user';
  return null;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}

/**
 * Get the current authenticated user's ID
 * Throws if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

/**
 * Get user profile from Supabase
 * Uses service role key for server-side operations
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data;
}

/**
 * Create or update user profile in Supabase
 * Used by webhook and fallback mechanisms
 */
export async function upsertUserProfile(
  userId: string,
  email: string,
  updates?: Partial<Omit<UserProfile, 'id' | 'email' | 'created_at' | 'updated_at'>>
): Promise<UserProfile> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        clerk_id: userId,
        email,
        codeforces_handle: updates?.codeforces_handle || '',
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting user profile:', error);
    throw error;
  }

  return data;
}

/**
 * Verify environment variables are set
 */
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
