import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Start game and notify all participants
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { roomId } = body;

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

    // Verify that the user is the room creator
    const { data: invites, error: invitesError } = await supabase
      .from('room_invites')
      .select('inviter_clerk_id')
      .eq('room_id', roomId)
      .limit(1);

    if (invitesError || !invites || invites.length === 0) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const roomCreatorId = invites[0].inviter_clerk_id;
    if (roomCreatorId !== userId) {
      return NextResponse.json(
        { error: 'Only room creator can start the game' },
        { status: 403 }
      );
    }

    // Try to create a game start notification record
    const gameStartTime = new Date().toISOString();
    let gameStart = null;
    
    try {
      const { data, error } = await supabase
        .from('room_game_start')
        .upsert({
          room_id: roomId,
          started_by: userId,
          started_at: gameStartTime,
          status: 'started'
        }, {
          onConflict: 'room_id'
        })
        .select()
        .single();

      if (error) {
        console.log('Game start table not available, using fallback notification method:', error.message);
      } else {
        gameStart = data;
        console.log('Game start record created successfully');
      }
    } catch (error) {
      console.log('Game start table not available, using fallback notification method');
    }

    // If game start table is not available, use room_config to store game status
    if (!gameStart) {
      try {
        const { error: configUpdateError } = await supabase
          .from('room_config')
          .update({
            game_status: 'started',
            game_started_by: userId,
            game_started_at: gameStartTime,
            updated_at: gameStartTime
          })
          .eq('room_id', roomId);

        if (configUpdateError) {
          console.error('Failed to update room config with game status:', configUpdateError);
        } else {
          console.log('Game status updated in room_config successfully');
        }
      } catch (error) {
        console.error('Error updating room config:', error);
      }
    }

    // Get all participants in the room
    const { data: participants, error: participantsError } = await supabase
      .from('room_invites')
      .select('invited_clerk_id, slot')
      .eq('room_id', roomId)
      .eq('status', 'accepted');

    if (participantsError) {
      console.error('Failed to get participants:', participantsError);
    }

    console.log(`Game started for room ${roomId} by ${userId}`);
    console.log(`Participants to notify:`, participants?.map(p => p.invited_clerk_id) || []);

    return NextResponse.json({ 
      success: true, 
      gameStartTime,
      participants: participants || [],
      notificationMethod: gameStart ? 'room_game_start' : 'room_config'
    });
  } catch (error) {
    console.error('Start game API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}