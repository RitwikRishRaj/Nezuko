import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { codeforcesHandle } = await request.json();
    
    if (!codeforcesHandle) {
      return NextResponse.json(
        { error: 'Codeforces handle is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Insert or update user in Supabase
    const { data, error } = await supabase
      .from('users')
      .upsert({
        clerk_id: userId,
        codeforces_handle: codeforcesHandle,
        is_verified: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'clerk_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save user', details: error.message },
        { status: 500 }
      );
    }

    console.log('User created successfully:', data);
    return NextResponse.json({ success: true, user: data });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
