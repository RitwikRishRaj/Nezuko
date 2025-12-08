import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('=== Discard Room API Called ===');
  
  try {
    const { userId } = await auth();
    console.log('User ID:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { roomId } = await request.json();
    console.log('Room ID to discard:', roomId);

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

    // Delete all invites for this room
    const { error: deleteError, count } = await supabase
      .from('room_invites')
      .delete()
      .eq('room_id', roomId)
      .eq('inviter_clerk_id', userId); // Only creator can discard

    if (deleteError) {
      console.error('Failed to delete invites:', deleteError);
      return NextResponse.json(
        { error: `Failed to discard room: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log(`Deleted ${count || 0} invites for room ${roomId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Room discarded successfully',
      deletedCount: count || 0
    });
    
  } catch (error) {
    console.error('Discard room API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
