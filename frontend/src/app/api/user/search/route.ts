import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('=== Search API Route Called ===');
  
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');

    console.log('Search handle parameter:', handle);

    if (!handle || handle.trim().length < 2) {
      console.log('Handle too short or missing');
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters', users: [] },
        { status: 400 }
      );
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Supabase URL exists:', !!supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error - missing environment variables', users: [] },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created');

    const searchTerm = handle.trim();
    console.log('Searching for handle:', searchTerm);

    // Search for users by Codeforces handle (case-insensitive partial match)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, codeforces_handle, clerk_id')
      .ilike('codeforces_handle', `%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error('Supabase search error:', error);
      return NextResponse.json(
        { 
          error: `Database error: ${error.message}`, 
          details: error,
          users: [] 
        },
        { status: 500 }
      );
    }

    console.log(`Search completed. Found ${users?.length || 0} users:`, users);
    
    return NextResponse.json({ 
      users: users || [],
      count: users?.length || 0,
      searchTerm 
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: errorMessage,
        users: [] 
      },
      { status: 500 }
    );
  }
}
