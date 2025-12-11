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
    
    const { data, error } = await this.supabase
      .from('room_config')
      .upsert(roomData, { onConflict: 'room_id' })
      .select()
      .single();

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
}

module.exports = new DatabaseService();