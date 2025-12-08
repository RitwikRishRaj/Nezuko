import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('=== Invite API Called ===');
  
  try {
    const { userId } = await auth();
    console.log('User ID:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const { invitedUserId, roomId, slot, slotType, roomMode } = body;

    if (!invitedUserId || !roomId || !slot || !slotType) {
      console.log('Missing fields:', { invitedUserId, roomId, slot, slotType });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user already has an accepted invite for this room
    const { data: existingInvite } = await supabase
      .from('room_invites')
      .select('slot')
      .eq('room_id', roomId)
      .eq('invited_clerk_id', invitedUserId)
      .eq('status', 'accepted')
      .single();

    if (existingInvite) {
      console.log('User already invited to slot:', existingInvite.slot);
      return NextResponse.json(
        { error: `User is already in slot ${existingInvite.slot}` },
        { status: 400 }
      );
    }

    // Get the inviter's info
    console.log('Fetching inviter info for clerk_id:', userId);
    const { data: inviter, error: inviterError } = await supabase
      .from('users')
      .select('codeforces_handle')
      .eq('clerk_id', userId)
      .single();

    if (inviterError) {
      console.error('Error fetching inviter:', inviterError);
    }
    console.log('Inviter:', inviter);

    // Get the invited user's handle from users table
    console.log('Fetching invited user handle for clerk_id:', invitedUserId);
    const { data: invitedUser, error: invitedUserError } = await supabase
      .from('users')
      .select('codeforces_handle')
      .eq('clerk_id', invitedUserId)
      .single();

    if (invitedUserError) {
      console.error('Error fetching invited user:', invitedUserError);
    }
    console.log('Invited user:', invitedUser);

    // Create invite notification with invited_handle
    const inviteData = {
      room_id: roomId,
      inviter_clerk_id: userId,
      inviter_handle: inviter?.codeforces_handle || 'Unknown',
      invited_clerk_id: invitedUserId,
      invited_handle: invitedUser?.codeforces_handle || 'Unknown',
      slot,
      slot_type: slotType,
      room_mode: roomMode || 'team-vs-team',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    console.log('Creating invite with data:', inviteData);
    
    const { data: invite, error } = await supabase
      .from('room_invites')
      .insert(inviteData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create invite:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}`, details: error },
        { status: 500 }
      );
    }

    console.log('Invite created successfully:', invite);
    return NextResponse.json({ success: true, invite });
  } catch (error) {
    console.error('Invite API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
