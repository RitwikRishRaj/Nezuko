const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Room Configuration Operations
  async createOrUpdateRoomConfig(roomData) {
    console.log('Database: Creating/updating room config with data:', roomData);
    
    // Try to upsert with all columns first
    let { data, error } = await this.supabase
      .from('room_config')
      .upsert(roomData, { onConflict: 'room_id' })
      .select()
      .single();

    // If error mentions missing column, try without custom links columns
    if (error && (error.message?.includes('custom_problem_links') || error.message?.includes('use_custom_links'))) {
      console.warn('⚠️ Database: custom_problem_links columns may not exist in room_config, trying without them');
      const { custom_problem_links, use_custom_links, ...roomDataWithoutCustomLinks } = roomData;
      
      const result = await this.supabase
        .from('room_config')
        .upsert(roomDataWithoutCustomLinks, { onConflict: 'room_id' })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Database: Room config upsert error:', error);
      throw error;
    }
    
    console.log('Database: Room config upsert successful:', data);
    return data;
  }

  async getRoomConfig(roomId) {
    const { data, error } = await this.supabase
      .from('room_config')
      .select('*')
      .eq('room_id', roomId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async deleteRoomConfig(roomId) {
    const { error } = await this.supabase
      .from('room_config')
      .delete()
      .eq('room_id', roomId);

    if (error) throw error;
  }

  // Room Invites Operations
  async createRoomInvite(inviteData) {
    const { data, error } = await this.supabase
      .from('room_invites')
      .insert(inviteData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getRoomInvites(roomId) {
    const { data, error } = await this.supabase
      .from('room_invites')
      .select('*')
      .eq('room_id', roomId);

    if (error) throw error;
    return data || [];
  }

  async updateInviteStatus(roomId, invitedUserId, status) {
    const { data, error } = await this.supabase
      .from('room_invites')
      .update({ 
        status,
        responded_at: new Date().toISOString()
      })
      .eq('room_id', roomId)
      .eq('invited_clerk_id', invitedUserId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeRoomInvite(roomId, slot) {
    console.log('Database: Removing room invite for room:', roomId, 'slot:', slot);
    
    // Update status to 'kicked' first for realtime notification
    const { error: updateError } = await this.supabase
      .from('room_invites')
      .update({ 
        status: 'kicked',
        responded_at: new Date().toISOString()
      })
      .eq('room_id', roomId)
      .eq('slot', slot);
    
    if (updateError) {
      console.error('Database: Update to kicked status error:', updateError);
      throw updateError;
    }
    
    console.log('Database: Updated invite status to kicked');
    
    // Delete after a short delay to allow realtime notification
    setTimeout(async () => {
      const { error: deleteError } = await this.supabase
        .from('room_invites')
        .delete()
        .eq('room_id', roomId)
        .eq('slot', slot);
      
      if (deleteError) {
        console.error('Database: Delete error:', deleteError);
      } else {
        console.log('Database: Invite deleted after kick notification');
      }
    }, 1000);
  }

  async deleteAllRoomInvites(roomId) {
    const { error } = await this.supabase
      .from('room_invites')
      .delete()
      .eq('room_id', roomId);

    if (error) throw error;
  }

  async getUserPendingInvites(userId) {
    const { data, error } = await this.supabase
      .from('room_invites')
      .select('*')
      .eq('invited_clerk_id', userId)
      .eq('status', 'pending');

    if (error) throw error;
    return data || [];
  }

  // Game Start Operations - now uses room_config table
  async createGameStart(gameData) {
    // Use room_config table for game start status
    return await this.updateRoomGameStatus(gameData.room_id, {
      game_status: gameData.status || 'started',
      game_started_by: gameData.started_by,
      game_started_at: gameData.started_at
    });
  }

  async updateRoomGameStatus(roomId, statusData) {
    const { data, error } = await this.supabase
      .from('room_config')
      .update({
        ...statusData,
        updated_at: new Date().toISOString()
      })
      .eq('room_id', roomId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Fallback: Create arena session directly if arena-service is unavailable
  async createArenaSessionFallback(sessionData) {
    console.log('🔄 Room Service: Creating arena session directly (fallback)');
    console.log('🔄 Session data:', {
      room_id: sessionData.room_id,
      questionsLength: sessionData.questions?.length || 0,
      use_custom_links: sessionData.use_custom_links,
      custom_problem_links_length: sessionData.custom_problem_links?.length || 0
    });
    
    const { data, error } = await this.supabase
      .from('arena_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('🔄 Room Service: Arena session creation error:', error);
      throw error;
    }
    
    console.log('🔄 Room Service: Arena session created successfully:', data.id);
    return data;
  }

  // Fallback: Create participant directly if arena-service is unavailable
  async createParticipantFallback(participantData) {
    const { data, error } = await this.supabase
      .from('participant_progress')
      .insert({
        ...participantData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('🔄 Room Service: Participant creation error:', error);
      throw error;
    }
    
    return data;
  }
}


module.exports = new DatabaseService();
