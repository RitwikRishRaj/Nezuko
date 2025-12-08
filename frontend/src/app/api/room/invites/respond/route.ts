import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { inviteId, action } = await request.json();

    if (!inviteId || !action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get invite details first
    const { data: invite, error: fetchError } = await supabase
      .from('room_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('invited_clerk_id', userId)
      .single();

    if (fetchError || !invite) {
      console.error('Failed to fetch invite:', fetchError);
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    if (action === 'accept') {
      // Update invite status to accepted (temporary, will be deleted when arena ends)
      const { error: updateError } = await supabase
        .from('room_invites')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('id', inviteId);

      if (updateError) {
        console.error('Failed to update invite:', updateError);
        return NextResponse.json(
          { error: 'Failed to accept invite' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        action: 'accepted',
        invite,
        message: 'Invite accepted'
      });
    } else {
      // Delete rejected invites immediately
      const { error: deleteError } = await supabase
        .from('room_invites')
        .delete()
        .eq('id', inviteId);

      if (deleteError) {
        console.error('Failed to delete invite:', deleteError);
        return NextResponse.json(
          { error: 'Failed to reject invite' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        action: 'rejected',
        message: 'Invite rejected'
      });
    }
  } catch (error) {
    console.error('Respond to invite API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
