import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  
  try {
    const { userId } = await auth();
    console.log('Requesting user ID:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { roomId, slot } = await request.json();
    console.log('Remove request:', { roomId, slot });

    if (!roomId || !slot) {
      return NextResponse.json(
        { error: 'Room ID and slot are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, check what we're about to delete
    const { data: inviteToDelete } = await supabase
      .from('room_invites')
      .select('*')
      .eq('room_id', roomId)
      .eq('slot', slot)
      .eq('status', 'accepted')
      .single();
    
    console.log('Invite to delete:', inviteToDelete);

    // Delete the invite for this slot
    const { error, count } = await supabase
      .from('room_invites')
      .delete()
      .eq('room_id', roomId)
      .eq('slot', slot)
      .eq('status', 'accepted');

    if (error) {
      console.error('Failed to remove user:', error);
      return NextResponse.json(
        { error: 'Failed to remove user' },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully deleted ${count || 0} invite(s) for slot ${slot}`);
    return NextResponse.json({ success: true, deletedCount: count || 0 });
  } catch (error) {
    console.error('Remove user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
