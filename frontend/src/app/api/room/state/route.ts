import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all invites for this room
    const { data: invites, error } = await supabase
      .from('room_invites')
      .select('*')
      .eq('room_id', roomId);

    if (error) {
      console.error('Failed to fetch room state:', error);
      return NextResponse.json(
        { error: 'Failed to fetch room state' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      roomId,
      invites: invites || []
    });
  } catch (error) {
    console.error('Room state API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
