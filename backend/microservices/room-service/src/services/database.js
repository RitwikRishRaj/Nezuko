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
    const { data, error } = await this.supabase
      .from('room_config')
      .upsert(roomData, { onConflict: 'room_id' })
      .select()
      .single();

    if (error) throw error;
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
      .update({ status, updated_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('invited_clerk_id', invitedUserId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeRoomInvite(roomId, slot) {
    const { error } = await this.supabase
      .from('room_invites')
      .delete()
      .eq('room_id', roomId)
      .eq('slot', slot);

    if (error) throw error;
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

  // Game Start Operations
  async createGameStart(gameData) {
    try {
      const { data, error } = await this.supabase
        .from('room_game_start')
        .upsert(gameData, { onConflict: 'room_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      // Fallback to room_config if room_game_start table doesn't exist
      console.log('Using room_config fallback for game start');
      return await this.updateRoomGameStatus(gameData.room_id, {
        game_status: 'started',
        game_started_by: gameData.started_by,
        game_started_at: gameData.started_at
      });
    }
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