import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type UserData = {
  id: string;
  emailAddresses?: Array<{ email_address: string }>;
  email_address?: string; // For direct email access
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  // Add Clerk's user object structure
  email_addresses?: Array<{ email_address: string }>;
  first_name?: string;
  last_name?: string;
  image_url?: string;
  created_at?: number;
  updated_at?: number;
};

export async function syncUserToSupabase(user: UserData) {
  if (!user) {
    console.error('No user data provided');
    return null;
  }

  // Log the entire user object to debug (removed in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log('User object structure:', JSON.stringify(user, null, 2));
  }
  
  // Try different possible email locations in the user object
  const email = user.emailAddresses?.[0]?.email_address ||  // Common pattern
                user.email_address ||                      // Direct email
                user.email_addresses?.[0]?.email_address;   // Alternative pattern
                
  if (!email) {
    console.error('No email address found in user object. Available keys:', Object.keys(user));
    return null;
  }

  const userData = {
    id: user.id,
    email: email,
    first_name: user.firstName || user.first_name || '',
    last_name: user.lastName || user.last_name || '',
    image_url: user.imageUrl || user.image_url || null,
    created_at: user.createdAt || (user.created_at ? new Date(user.created_at * 1000).toISOString() : new Date().toISOString()),
    updated_at: user.updatedAt || (user.updated_at ? new Date(user.updated_at * 1000).toISOString() : new Date().toISOString()),
  };

  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(userData, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('Synced user to Supabase:', data.id);
    return data;
  } catch (error) {
    console.error('Error syncing user to Supabase:', error);
    throw error;
  }
}
